"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canManageBusinessConfig, requireBusinessContext } from "@/lib/dal";
import { businessSettingsSchema, domainSchema } from "@/lib/validation/business-settings";
import { revalidateSiteChrome } from "@/lib/revalidate";
import type { FormState } from "@/lib/actions/auth";

/**
 * Business type and currency.
 *
 * Changing the business type changes the public site's vocabulary and the URL
 * its catalog lives at (/menu vs /shop vs /services), so it's gated behind the
 * config-capable roles rather than open to every member.
 */
export async function updateBusinessSettings(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { business, role } = await requireBusinessContext();

  if (!canManageBusinessConfig(role)) {
    return { error: "Your role can't change business settings." };
  }

  const parsed = businessSettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({
      business_type: parsed.data.business_type,
      currency: parsed.data.currency,
    })
    .eq("id", business.id);

  if (error) {
    return { error: `Couldn't save settings: ${error.message}` };
  }

  revalidatePath("/admin", "layout");
  revalidateSiteChrome();

  return { message: "Settings saved." };
}

export async function addDomain(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { business, role } = await requireBusinessContext();

  if (!canManageBusinessConfig(role)) {
    return { error: "Your role can't manage domains." };
  }

  const parsed = domainSchema.safeParse({ hostname: formData.get("hostname") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid domain." };
  }

  const supabase = await createClient();

  // The first domain a business adds becomes its canonical one.
  const { count } = await supabase
    .from("business_domains")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  const { error } = await supabase.from("business_domains").insert({
    business_id: business.id,
    hostname: parsed.data.hostname,
    is_primary: (count ?? 0) === 0,
  });

  if (error) {
    // hostname is globally unique: it decides which business a request is
    // served, so it cannot belong to two businesses at once.
    if (error.code === "23505") {
      return { error: "That domain is already connected to a business." };
    }
    return { error: `Couldn't add the domain: ${error.message}` };
  }

  revalidatePath("/admin/settings");
  return { message: `${parsed.data.hostname} added.` };
}

export async function removeDomain(domainId: string): Promise<{ error?: string }> {
  const { business, role } = await requireBusinessContext();

  if (!canManageBusinessConfig(role)) {
    return { error: "Your role can't manage domains." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("business_domains")
    .delete()
    .eq("id", domainId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't remove the domain: ${error.message}` };

  revalidatePath("/admin/settings");
  return {};
}

export async function setPrimaryDomain(domainId: string): Promise<{ error?: string }> {
  const { business, role } = await requireBusinessContext();

  if (!canManageBusinessConfig(role)) {
    return { error: "Your role can't manage domains." };
  }

  const supabase = await createClient();

  // A partial unique index allows only one primary row per business, so the
  // old primary has to be cleared before the new one is set.
  const { error: clearError } = await supabase
    .from("business_domains")
    .update({ is_primary: false })
    .eq("business_id", business.id)
    .eq("is_primary", true);

  if (clearError) return { error: `Couldn't update domains: ${clearError.message}` };

  const { error } = await supabase
    .from("business_domains")
    .update({ is_primary: true })
    .eq("id", domainId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't set the primary domain: ${error.message}` };

  revalidatePath("/admin/settings");
  return {};
}
