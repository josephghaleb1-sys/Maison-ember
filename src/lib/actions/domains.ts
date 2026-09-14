"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { hostnameSchema } from "@/lib/validation/settings";

/**
 * Custom domains. A hostname row is what maps an incoming request to this
 * business (see src/lib/business.ts) — adding one here is the application
 * half of connecting a domain; the other half is pointing DNS at the
 * deployment and adding the domain in Vercel (see README).
 */
export async function addDomain(formData: FormData): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();

  const parsed = hostnameSchema.safeParse(formData.get("hostname"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid hostname." };
  }

  const supabase = await createClient();
  const makePrimary = formData.get("is_primary") === "on";

  if (makePrimary) {
    // Only one primary per business (enforced by a partial unique index too).
    await supabase
      .from("business_domains")
      .update({ is_primary: false })
      .eq("business_id", business.id);
  }

  const { error } = await supabase.from("business_domains").insert({
    business_id: business.id,
    hostname: parsed.data,
    is_primary: makePrimary,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That hostname is already connected to a business." };
    }
    return { error: `Couldn't add the domain: ${error.message}` };
  }

  revalidatePath("/admin/website");
  return {};
}

export async function removeDomain(domainId: string): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("business_domains")
    .delete()
    .eq("id", domainId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't remove the domain: ${error.message}` };

  revalidatePath("/admin/website");
  return {};
}

export async function setPrimaryDomain(domainId: string): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error: clearError } = await supabase
    .from("business_domains")
    .update({ is_primary: false })
    .eq("business_id", business.id);
  if (clearError) return { error: clearError.message };

  const { error } = await supabase
    .from("business_domains")
    .update({ is_primary: true })
    .eq("id", domainId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't set the primary domain: ${error.message}` };

  revalidatePath("/admin/website");
  return {};
}
