"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { websiteSchema } from "@/lib/validation/website";
import { uploadBusinessImage, deleteBusinessImage } from "@/lib/actions/upload";
import { revalidateSiteChrome } from "@/lib/revalidate";
import type { FormState } from "@/lib/actions/auth";

/**
 * Handles one image field (logo or hero): upload a replacement, clear the
 * existing one, or leave it untouched. The old file is only deleted once the
 * new upload has succeeded, so a failed upload can't leave the business with
 * no logo at all.
 */
async function handleImageField(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  userId: string,
  kind: "logo" | "hero",
  formData: FormData,
  currentPath: string | null,
): Promise<{ path: string | null } | { error: string }> {
  const file = formData.get(`${kind}_image`);
  const remove = formData.get(`remove_${kind}_image`) === "on";

  if (file instanceof File && file.size > 0) {
    const result = await uploadBusinessImage(supabase, businessId, userId, kind, file);
    if ("error" in result) return { error: result.error };
    if (currentPath) await deleteBusinessImage(supabase, currentPath);
    return { path: result.path };
  }

  if (remove && currentPath) {
    await deleteBusinessImage(supabase, currentPath);
    return { path: null };
  }

  return { path: currentPath };
}

/** Branding, hero copy and SEO — everything that shapes how the public site
 * looks and how it's described to search engines. */
export async function updateWebsite(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { business, userId } = await requireBusinessContext();

  const parsed = websiteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("website_settings")
    .select("logo_path, hero_image_path, business_name")
    .eq("business_id", business.id)
    .maybeSingle();

  if (readError) {
    return { error: `Couldn't load your current settings: ${readError.message}` };
  }

  const logoResult = await handleImageField(
    supabase, business.id, userId, "logo", formData, existing?.logo_path ?? null,
  );
  if ("error" in logoResult) return { error: logoResult.error };

  const heroResult = await handleImageField(
    supabase, business.id, userId, "hero", formData, existing?.hero_image_path ?? null,
  );
  if ("error" in heroResult) return { error: heroResult.error };

  const { error } = await supabase.from("website_settings").upsert(
    {
      business_id: business.id,
      // Required by the table when no row exists yet; preserved otherwise.
      business_name: existing?.business_name ?? business.name,
      primary_color: parsed.data.primary_color,
      secondary_color: parsed.data.secondary_color,
      hero_title: parsed.data.hero_title,
      hero_subtitle: parsed.data.hero_subtitle,
      seo_title: parsed.data.seo_title,
      seo_description: parsed.data.seo_description,
      logo_path: logoResult.path,
      hero_image_path: heroResult.path,
    },
    { onConflict: "business_id" },
  );

  if (error) {
    return { error: `Couldn't save your website settings: ${error.message}` };
  }

  revalidatePath("/admin/website");
  revalidateSiteChrome();

  return { message: "Website settings saved." };
}
