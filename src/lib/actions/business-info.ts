"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { businessInfoSchema } from "@/lib/validation/business-info";
import { revalidateSiteChrome } from "@/lib/revalidate";
import type { FormState } from "@/lib/actions/auth";
import type { WebsiteHours, WebsiteSocialLinks } from "@/lib/database.types";

/**
 * Business identity and contact details.
 *
 * `business.id` comes from the signed-in user's membership (never from the
 * form), and RLS re-checks that membership on the write — a crafted request
 * can't retarget another business's row.
 */
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

  if (error) {
    return { error: `Couldn't save your business info: ${error.message}` };
  }

  // businesses.name mirrors website_settings.business_name so the dashboard
  // chrome and any business listing show the current name too.
  const { error: nameError } = await supabase
    .from("businesses")
    .update({ name: parsed.data.business_name })
    .eq("id", business.id);

  if (nameError) {
    return { error: `Saved, but the business name didn't update: ${nameError.message}` };
  }

  revalidatePath("/admin/business");
  revalidatePath("/admin", "layout");
  revalidateSiteChrome();

  return { message: "Business info saved." };
}
