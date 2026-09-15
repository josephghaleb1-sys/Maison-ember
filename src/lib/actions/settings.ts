"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { businessInfoSchema, websiteSettingsSchema } from "@/lib/validation/settings";
import { uploadBusinessImage, deleteBusinessImage } from "@/lib/actions/upload";
import type { FormState } from "@/lib/actions/auth";
import type { MediaKind, WebsiteHours, WebsiteSocialLinks } from "@/lib/database.types";

/** Public pages that can change when settings change. */
function revalidatePublicSite() {
  revalidatePath("/", "layout");
}

type ImageKind = Extract<MediaKind, "logo" | "hero" | "og">;

/**
 * Handles one optional image field on a settings form: a new upload replaces
 * (and deletes) the old file, a "remove" checkbox clears it, and doing
 * neither leaves it untouched.
 */
async function handleImageField(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  userId: string,
  kind: ImageKind,
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

/** Dashboard -> Business info. */
export async function updateBusinessInfo(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { business } = await requireBusinessContext();

  const parsed = businessInfoSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();

  const hours: WebsiteHours = {
    mon: parsed.data.hours_mon,
    tue: parsed.data.hours_tue,
    wed: parsed.data.hours_wed,
    thu: parsed.data.hours_thu,
    fri: parsed.data.hours_fri,
    sat: parsed.data.hours_sat,
    sun: parsed.data.hours_sun,
  };

  const social_links: WebsiteSocialLinks = {
    instagram: parsed.data.social_instagram || undefined,
    facebook: parsed.data.social_facebook || undefined,
    twitter: parsed.data.social_twitter || undefined,
    tiktok: parsed.data.social_tiktok || undefined,
    yelp: parsed.data.social_yelp || undefined,
  };

  // business_id is taken from the session's membership, never from the form —
  // a client can't aim this write at someone else's business, and RLS would
  // reject it even if it tried.
  const { error } = await supabase.from("website_settings").upsert(
    {
      business_id: business.id,
      business_name: parsed.data.business_name,
      tagline: parsed.data.tagline,
      about_text: parsed.data.about_text,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      email: parsed.data.email,
      address: parsed.data.address,
      hours,
      social_links,
    },
    { onConflict: "business_id" },
  );

  if (error) return { error: `Couldn't save business info: ${error.message}` };

  const { error: businessError } = await supabase
    .from("businesses")
    .update({ name: parsed.data.business_name, industry: parsed.data.industry })
    .eq("id", business.id);

  if (businessError) return { error: `Couldn't save business info: ${businessError.message}` };

  revalidatePath("/admin", "layout");
  revalidatePublicSite();
  return { message: "Business info saved." };
}

/** Dashboard -> Website (branding, hero copy, SEO, images). */
export async function updateWebsiteSettings(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { business, userId } = await requireBusinessContext();

  const parsed = websiteSettingsSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    show_prices: formData.get("show_prices") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("website_settings")
    .select("logo_path, hero_image_path, og_image_path, business_name")
    .eq("business_id", business.id)
    .maybeSingle();

  const images: Record<ImageKind, string | null> = {
    logo: existing?.logo_path ?? null,
    hero: existing?.hero_image_path ?? null,
    og: existing?.og_image_path ?? null,
  };

  for (const kind of ["logo", "hero", "og"] as ImageKind[]) {
    const result = await handleImageField(
      supabase,
      business.id,
      userId,
      kind,
      formData,
      images[kind],
    );
    if ("error" in result) return { error: result.error };
    images[kind] = result.path;
  }

  const { error } = await supabase.from("website_settings").upsert(
    {
      business_id: business.id,
      // Keep the NOT NULL business_name satisfied if this row is created here
      // before Business info has ever been saved.
      business_name: existing?.business_name || business.name,
      hero_title: parsed.data.hero_title,
      hero_subtitle: parsed.data.hero_subtitle,
      hero_cta_label: parsed.data.hero_cta_label,
      primary_color: parsed.data.primary_color.toLowerCase(),
      secondary_color: parsed.data.secondary_color.toLowerCase(),
      seo_title: parsed.data.seo_title,
      seo_description: parsed.data.seo_description,
      currency: parsed.data.currency,
      show_prices: parsed.data.show_prices,
      color_mode: parsed.data.color_mode,
      order_email: parsed.data.order_email,
      logo_path: images.logo,
      hero_image_path: images.hero,
      og_image_path: images.og,
    },
    { onConflict: "business_id" },
  );

  if (error) return { error: `Couldn't save website settings: ${error.message}` };

  revalidatePath("/admin", "layout");
  revalidatePublicSite();
  return { message: "Website settings saved." };
}
