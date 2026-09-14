import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIndustryPreset, type IndustryPreset } from "@/lib/industry";
import type { Business, BusinessRole } from "@/lib/database.types";

export interface AuthedContext {
  userId: string;
  email: string | null;
  business: Business;
  role: BusinessRole;
  /** Industry vocabulary, so the dashboard says "Services"/"Menu"/"Products". */
  preset: IndustryPreset;
}

/**
 * Verifies the caller is signed in AND resolves the business they belong
 * to via business_members. Redirects to /admin/login otherwise. This is
 * the Data Access Layer every admin Server Component / Server Action
 * should call before touching business data — RLS enforces the same rule
 * at the database, this just gives a clean redirect + one round trip.
 *
 * Memoized per-request with React `cache`.
 */
export const requireBusinessContext = cache(async (): Promise<AuthedContext> => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_members")
    .select("role, business:businesses(id, slug, name, industry, is_active, created_at)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership || !membership.business) {
    redirect("/admin/login?error=no-business");
  }

  const business = Array.isArray(membership.business)
    ? membership.business[0]
    : membership.business;

  return {
    userId: user.id,
    email: user.email ?? null,
    business,
    role: membership.role,
    preset: getIndustryPreset(business.industry),
  };
});
