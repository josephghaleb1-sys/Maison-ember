"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { settingsSchema } from "@/lib/validation/settings";
import { uploadBusinessImage, deleteBusinessImage } from "@/lib/actions/upload";
import type { FormState } from "@/lib/actions/auth";
import type { WebsiteHours, WebsiteSocialLinks } from "@/lib/database.types";

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

export async function updateSettings(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { business, userId } = await requireBusinessContext();

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("website_settings")
    .select("logo_path, hero_image_path")
    .eq("business_id", business.id)
    .maybeSingle();

  const logoResult = await handleImageField(
    supabase,
    business.id,
    userId,
    "logo",
    formData,
    existing?.logo_path ?? null,
  );
  if ("error" in logoResult) return { error: logoResult.error };

  const heroResult = await handleImageField(
    supabase,
    business.id,
    userId,
    "hero",
    formData,
    existing?.hero_image_path ?? null,
  );
  if ("error" in heroResult) return { error: heroResult.error };

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

  const { error } = await supabase.from("website_settings").upsert(
    {
      business_id: business.id,
      business_name: parsed.data.business_name,
      tagline: parsed.data.tagline,
      about_text: parsed.data.about_text,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      hours,
      social_links,
      logo_path: logoResult.path,
      hero_image_path: heroResult.path,
    },
    { onConflict: "business_id" },
  );

  if (error) {
    return { error: `Couldn't save settings: ${error.message}` };
  }

  // Business name in `businesses` mirrors website_settings.business_name for display.
  await supabase.from("businesses").update({ name: parsed.data.business_name }).eq("id", business.id);

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");

  return { message: "Settings saved." };
}
