import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessTypeConfig, type BusinessTypeConfig } from "@/lib/business-types";
import type { Business, Category, Media, Product, WebsiteSettings } from "@/lib/database.types";

/**
 * Resolves which business a public request belongs to.
 *
 * Two mechanisms, in priority order:
 *
 *  1. **Hostname** — the request's Host header is looked up in
 *     `business_domains`. This is what lets ONE Vercel deployment serve
 *     Business A, B and C on their own custom domains.
 *  2. **NEXT_PUBLIC_BUSINESS_SLUG** — a fallback for local development and
 *     for single-tenant deployments where a business has a project of its
 *     own and no domain row yet.
 *
 * Neither path trusts client-supplied identifiers beyond the Host header,
 * and the Host header only ever selects a business — it never grants write
 * access. All writes go through the authenticated dashboard, where the
 * business is derived from the user's membership and enforced again by RLS.
 */

const FALLBACK_SLUG = process.env.NEXT_PUBLIC_BUSINESS_SLUG?.trim() || "";

/** Strips the port and any trailing dot, lowercases — matching the format
 * hostnames are stored in (enforced by CHECK constraints in migration 0003). */
export function normalizeHostname(host: string | null | undefined): string {
  if (!host) return "";
  return host.trim().toLowerCase().split(":")[0].replace(/\.$/, "");
}

export const getPublicBusiness = cache(async (): Promise<Business> => {
  const supabase = await createClient();
  const headersList = await headers();
  const hostname = normalizeHostname(headersList.get("host"));

  if (hostname) {
    const { data: domain, error } = await supabase
      .from("business_domains")
      .select("business:businesses(*)")
      .eq("hostname", hostname)
      .maybeSingle();

    // A failed query is NOT "no such business" — surfacing it as a 404 would
    // hide an outage behind a page that looks deliberate. Let it throw so the
    // error boundary shows a real error (and it gets logged).
    if (error) throw new Error(`Could not resolve the site for "${hostname}": ${error.message}`);

    const matched = Array.isArray(domain?.business) ? domain?.business[0] : domain?.business;
    if (matched) return matched as Business;
  }

  if (FALLBACK_SLUG) {
    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", FALLBACK_SLUG)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Could not load the business "${FALLBACK_SLUG}": ${error.message}`,
      );
    }
    if (business) return business;
  }

  // The query worked and genuinely matched nothing: this host serves no
  // business, which is a 404 rather than an error.
  notFound();
});

/**
 * Same resolution as getPublicBusiness, but returns null instead of 404ing.
 *
 * Used by pages that must render even when no business matches the host —
 * the sign-in screen above all: a 404 there would lock an owner out of the
 * dashboard on a deployment whose domain isn't mapped yet.
 */
export const getOptionalPublicBusiness = cache(async (): Promise<Business | null> => {
  const supabase = await createClient();
  const headersList = await headers();
  const hostname = normalizeHostname(headersList.get("host"));

  if (hostname) {
    const { data: domain } = await supabase
      .from("business_domains")
      .select("business:businesses(*)")
      .eq("hostname", hostname)
      .maybeSingle();

    const matched = Array.isArray(domain?.business) ? domain?.business[0] : domain?.business;
    if (matched) return matched as Business;
  }

  if (FALLBACK_SLUG) {
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", FALLBACK_SLUG)
      .maybeSingle();
    if (business) return business;
  }

  return null;
});

/** Branding for a business resolved by host, used by the sign-in screen. */
export const getOptionalBrand = cache(async () => {
  const business = await getOptionalPublicBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("website_settings")
    .select("business_name, logo_path, primary_color, secondary_color")
    .eq("business_id", business.id)
    .maybeSingle();

  return {
    name: settings?.business_name || business.name,
    logoPath: settings?.logo_path ?? null,
  };
});

/** Industry vocabulary (catalog route, item nouns, CTA copy) for the business
 * being served. */
export const getPublicBusinessType = cache(async (): Promise<BusinessTypeConfig> => {
  const business = await getPublicBusiness();
  return getBusinessTypeConfig(business.business_type);
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

export const getPublicGalleryMedia = cache(async (): Promise<Media[]> => {
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

/** Everything the site chrome (header/footer/metadata) needs, in one pass.
 * Each getter is request-memoized, so calling this from both the layout and a
 * page costs one round trip, not two. */
export async function getSiteContext() {
  const [business, settings, type] = await Promise.all([
    getPublicBusiness(),
    getPublicSettings(),
    getPublicBusinessType(),
  ]);

  return {
    business,
    settings,
    type,
    businessName: settings?.business_name || business.name,
  };
}
