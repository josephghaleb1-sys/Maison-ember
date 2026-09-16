import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  BusinessDomain,
  Category,
  Media,
  Product,
  WebsiteSettings,
} from "@/lib/database.types";

export async function getDashboardStats(businessId: string) {
  const supabase = await createClient();
  const [products, visibleProducts, categories, media] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("is_visible", true),
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
  ]);

  return {
    totalProducts: products.count ?? 0,
    visibleProducts: visibleProducts.count ?? 0,
    totalCategories: categories.count ?? 0,
    totalMedia: media.count ?? 0,
  };
}

export async function getRecentProducts(businessId: string, limit = 5): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getProducts(businessId: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getProduct(businessId: string, productId: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", productId)
    .maybeSingle();
  return data;
}

export async function getCategories(businessId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getCategory(businessId: string, categoryId: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", categoryId)
    .maybeSingle();
  return data;
}

export async function getMediaLibrary(businessId: string): Promise<Media[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("media")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getWebsiteSettings(businessId: string): Promise<WebsiteSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("website_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  return data;
}

export async function getBusinessDomains(businessId: string): Promise<BusinessDomain[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_domains")
    .select("*")
    .eq("business_id", businessId)
    .order("is_primary", { ascending: false })
    .order("hostname", { ascending: true });
  return data ?? [];
}

/**
 * The URL the dashboard's "View website" button should open.
 *
 * A business with a connected custom domain gets its real public URL; one
 * without falls back to this deployment's own root, which is what a
 * single-tenant setup (NEXT_PUBLIC_BUSINESS_SLUG) serves.
 */
export async function getPublicSiteHref(businessId: string): Promise<string> {
  const domains = await getBusinessDomains(businessId);
  const primary = domains.find((d) => d.is_primary) ?? domains[0];
  return primary ? `https://${primary.hostname}` : "/";
}

export interface RecentChange {
  id: string;
  label: string;
  kind: "product" | "category" | "media";
  at: string;
}

/** A small "what changed lately" feed for the dashboard overview, merged from
 * the three tables an owner actually edits. */
export async function getRecentChanges(businessId: string, limit = 6): Promise<RecentChange[]> {
  const supabase = await createClient();

  const [products, categories, media] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, updated_at")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("categories")
      .select("id, name, updated_at")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("media")
      .select("id, file_name, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const changes: RecentChange[] = [
    ...(products.data ?? []).map((p) => ({
      id: `product-${p.id}`,
      label: p.name,
      kind: "product" as const,
      at: p.updated_at,
    })),
    ...(categories.data ?? []).map((c) => ({
      id: `category-${c.id}`,
      label: c.name,
      kind: "category" as const,
      at: c.updated_at,
    })),
    ...(media.data ?? []).map((m) => ({
      id: `media-${m.id}`,
      label: m.file_name,
      kind: "media" as const,
      at: m.created_at,
    })),
  ];

  return changes
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}
