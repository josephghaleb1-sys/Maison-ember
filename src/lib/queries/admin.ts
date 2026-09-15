import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  BusinessDomain,
  Category,
  DeliveryZone,
  Media,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Testimonial,
  WebsiteSettings,
} from "@/lib/database.types";

export async function getDashboardStats(businessId: string) {
  const supabase = await createClient();
  const [products, visibleProducts, categories, media, testimonials, newOrders] = await Promise.all([
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
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "new"),
  ]);

  return {
    totalProducts: products.count ?? 0,
    visibleProducts: visibleProducts.count ?? 0,
    totalCategories: categories.count ?? 0,
    totalMedia: media.count ?? 0,
    totalTestimonials: testimonials.count ?? 0,
    newOrders: newOrders.count ?? 0,
  };
}

export async function getOrders(
  businessId: string,
  status?: string,
): Promise<Order[]> {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(200);

  // Ignore an unknown ?status= rather than returning nothing for it.
  if (isOrderStatus(status)) query = query.eq("status", status);

  const { data } = await query;
  return data ?? [];
}

const ORDER_STATUS_VALUES: OrderStatus[] = [
  "new",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

function isOrderStatus(value: string | undefined): value is OrderStatus {
  return value !== undefined && (ORDER_STATUS_VALUES as string[]).includes(value);
}

export async function getOrder(
  businessId: string,
  orderId: string,
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  return { order, items: items ?? [] };
}

/** Counts per status, for the filter chips on the orders page. */
export async function getOrderStatusCounts(businessId: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("status")
    .eq("business_id", businessId)
    .limit(1000);

  const counts: Record<string, number> = { all: 0 };
  for (const row of data ?? []) {
    counts.all += 1;
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}

export async function getDeliveryZones(businessId: string): Promise<DeliveryZone[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });
  return data ?? [];
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
