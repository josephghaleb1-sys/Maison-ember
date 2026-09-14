import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIndustryPreset, type IndustryPreset } from "@/lib/industry";
import { buildBrandTheme, type BrandTheme } from "@/lib/theme";
import type {
  Business,
  Category,
  Product,
  Testimonial,
  WebsiteSettings,
} from "@/lib/database.types";

/**
 * Which business does this request belong to?
 *
 * Resolution order:
 *   1. The request's hostname, looked up in `business_domains`. This is what
 *      lets one deployment serve many customers on their own domains —
 *      point the domain at the app, add a row, done. No code changes.
 *   2. NEXT_PUBLIC_BUSINESS_SLUG, for local dev and single-tenant
 *      deployments (one Vercel project per customer).
 *
 * The hostname is never trusted for authorization — it only selects *public*
 * content, which RLS already exposes to anonymous visitors. Admin access is
 * resolved from the signed-in user's memberships (see src/lib/dal.ts).
 */
const FALLBACK_SLUG = process.env.NEXT_PUBLIC_BUSINESS_SLUG || "veloura-lab";

/** Strips port and lowercases; "Veloura.com:3000" -> "veloura.com". */
function normalizeHostname(host: string | null): string | null {
  if (!host) return null;
  const withoutPort = host.split(":")[0]?.trim().toLowerCase();
  return withoutPort || null;
}

export const getPublicBusiness = cache(async (): Promise<Business> => {
  const supabase = await createClient();
  const hostname = normalizeHostname((await headers()).get("host"));

  if (hostname) {
    const { data: domain } = await supabase
      .from("business_domains")
      .select("business:businesses(id, slug, name, industry, is_active, created_at)")
      .eq("hostname", hostname)
      .maybeSingle();

    const matched = Array.isArray(domain?.business) ? domain?.business[0] : domain?.business;
    if (matched && matched.is_active) return matched;
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug, name, industry, is_active, created_at")
    .eq("slug", FALLBACK_SLUG)
    .maybeSingle();

  if (!business || !business.is_active) notFound();
  return business;
});

/**
 * Branding for pages that render before anyone is signed in (the login and
 * password-reset screens). Unlike getPublicBusiness it never calls
 * notFound(): a deployment with no business configured yet must still be able
 * to show a sign-in form.
 */
export const getSignedOutBranding = cache(async (): Promise<{
  name: string;
  logoPath: string | null;
}> => {
  const supabase = await createClient();
  const hostname = normalizeHostname((await headers()).get("host"));

  const { data: domain } = hostname
    ? await supabase
        .from("business_domains")
        .select("business_id")
        .eq("hostname", hostname)
        .maybeSingle()
    : { data: null };

  const businessQuery = supabase
    .from("businesses")
    .select("id, name")
    .limit(1);

  const { data: business } = domain?.business_id
    ? await businessQuery.eq("id", domain.business_id).maybeSingle()
    : await businessQuery.eq("slug", FALLBACK_SLUG).maybeSingle();

  if (!business) return { name: "Dashboard", logoPath: null };

  const { data: settings } = await supabase
    .from("website_settings")
    .select("business_name, logo_path")
    .eq("business_id", business.id)
    .maybeSingle();

  return {
    name: settings?.business_name || business.name,
    logoPath: settings?.logo_path ?? null,
  };
});

export const getPublicSettings = cache(async (): Promise<WebsiteSettings | null> => {
  const business = await getPublicBusiness();
  const supabase = await createClient();
  const { data } = await supabase
    .from("website_settings")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();
  return data;
});

/**
 * Everything the chrome (header/footer/theme/metadata) needs, resolved once
 * per request. `cache()` dedupes it across the layout and every page.
 */
export const getSiteContext = cache(async (): Promise<{
  business: Business;
  settings: WebsiteSettings | null;
  businessName: string;
  preset: IndustryPreset;
  theme: BrandTheme;
}> => {
  const [business, settings] = await Promise.all([getPublicBusiness(), getPublicSettings()]);
  return {
    business,
    settings,
    businessName: settings?.business_name || business.name,
    preset: getIndustryPreset(business.industry),
    theme: buildBrandTheme(settings),
  };
});

export const getPublicCategories = cache(async (): Promise<Category[]> => {
  const business = await getPublicBusiness();
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
});

export const getPublicProducts = cache(async (): Promise<Product[]> => {
  const business = await getPublicBusiness();
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
});

export const getPublicGalleryMedia = cache(async () => {
  const business = await getPublicBusiness();
  const supabase = await createClient();
  const { data } = await supabase
    .from("media")
    .select("*")
    .eq("business_id", business.id)
    .eq("kind", "gallery")
    .eq("is_visible", true)
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const getPublicTestimonials = cache(async (): Promise<Testimonial[]> => {
  const business = await getPublicBusiness();
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
});

/** Absolute site origin for canonical URLs/OG tags — primary domain first. */
export const getSiteUrl = cache(async (): Promise<string> => {
  const business = await getPublicBusiness();
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_domains")
    .select("hostname")
    .eq("business_id", business.id)
    .eq("is_primary", true)
    .maybeSingle();

  if (data?.hostname) return `https://${data.hostname}`;
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  const host = normalizeHostname((await headers()).get("host")) ?? "localhost:3000";
  const raw = (await headers()).get("host") ?? "localhost:3000";
  return host.startsWith("localhost") ? `http://${raw}` : `https://${raw}`;
});
