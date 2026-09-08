import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product, WebsiteSettings } from "@/lib/database.types";

const BUSINESS_SLUG = process.env.NEXT_PUBLIC_BUSINESS_SLUG || "maison-ember";

/** Resolves the single business this deployment serves, for the public site. */
export const getPublicBusiness = cache(async () => {
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug, name, created_at")
    .eq("slug", BUSINESS_SLUG)
    .maybeSingle();

  if (!business) notFound();
  return business;
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
