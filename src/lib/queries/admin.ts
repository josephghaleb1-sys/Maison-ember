import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  BusinessDomain,
  Category,
  Media,
  Product,
  Testimonial,
  WebsiteSettings,
} from "@/lib/database.types";

export async function getDashboardStats(businessId: string) {
  const supabase = await createClient();
  const [products, visibleProducts, categories, media, testimonials] = await Promise.all([
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
    supabase
      .from("testimonials")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
  ]);

  return {
    totalProducts: products.count ?? 0,
    visibleProducts: visibleProducts.count ?? 0,
    totalCategories: categories.count ?? 0,
    totalMedia: media.count ?? 0,
    totalTestimonials: testimonials.count ?? 0,
  };
}

export async function getTestimonials(businessId: string): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getDomains(businessId: string): Promise<BusinessDomain[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_domains")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Images the owner can pick from when choosing a product photo. */
export async function getSelectableMedia(businessId: string): Promise<Media[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("media")
    .select("*")
    .eq("business_id", businessId)
    .in("kind", ["product", "gallery", "other"])
    .order("created_at", { ascending: false })
    .limit(60);
  return data ?? [];
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
