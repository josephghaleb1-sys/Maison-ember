"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { saleSchema } from "@/lib/validation/sale";
import { CATALOG_PATHS } from "@/lib/industry";

function revalidateEverywhere() {
  revalidatePath("/admin/sales");
  revalidatePath("/admin/products");
  revalidatePath("/");
  for (const path of CATALOG_PATHS) revalidatePath(path);
}

/**
 * Puts one item on sale, or takes it off.
 *
 * The product's own price is re-read here rather than trusted from the form,
 * so "sale must be cheaper" is checked against the real price even if the
 * page was left open while the price changed.
 */
export async function setProductSale(
  productId: string,
  values: { sale_price: string; sale_ends_at: string },
): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("price")
    .eq("id", productId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!product) return { error: "That item no longer exists." };

  const parsed = saleSchema.safeParse({ ...values, price: product.price });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the sale price." };
  }

  const { error } = await supabase
    .from("products")
    .update({
      sale_price: parsed.data.sale_price,
      // An end date with no sale price would be meaningless.
      sale_ends_at: parsed.data.sale_price === null ? null : parsed.data.sale_ends_at,
    })
    .eq("id", productId)
    .eq("business_id", business.id);

  if (error) {
    if (error.code === "23514") {
      return { error: "The sale price has to be lower than the normal price." };
    }
    return { error: `Couldn't save the sale: ${error.message}` };
  }

  revalidateEverywhere();
  return {};
}

export async function endProductSale(productId: string): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ sale_price: null, sale_ends_at: null })
    .eq("id", productId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't end the sale: ${error.message}` };

  revalidateEverywhere();
  return {};
}

/**
 * Takes a percentage off several items at once — the usual way a shop runs a
 * sale ("20% off everything in Skincare"). Prices are computed from each
 * item's own price, server-side.
 */
export async function startBulkSale(
  productIds: string[],
  percentOff: number,
  endsAt: string,
): Promise<{ error?: string; updated?: number }> {
  const { business } = await requireBusinessContext();

  const percent = Math.round(percentOff);
  if (!Number.isFinite(percent) || percent < 1 || percent > 90) {
    return { error: "Choose a discount between 1% and 90%." };
  }
  if (productIds.length === 0) return { error: "Select at least one item." };
  if (endsAt && Number.isNaN(new Date(endsAt).getTime())) {
    return { error: "That end date isn't valid." };
  }

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, price")
    .eq("business_id", business.id)
    .in("id", productIds.slice(0, 200));

  if (!products || products.length === 0) return { error: "Couldn't find those items." };

  const results = await Promise.all(
    products.map((product) => {
      // Round to whole cents, and never below zero.
      const discounted = Math.max(
        0,
        Math.round(Number(product.price) * (1 - percent / 100) * 100) / 100,
      );
      // An item priced at 0 can't be discounted into a valid sale.
      if (discounted >= Number(product.price)) return Promise.resolve({ error: null });
      return supabase
        .from("products")
        .update({ sale_price: discounted, sale_ends_at: endsAt || null })
        .eq("id", product.id)
        .eq("business_id", business.id);
    }),
  );

  const failed = results.filter((result) => "error" in result && result.error);
  revalidateEverywhere();

  if (failed.length > 0) {
    return { error: `${failed.length} item${failed.length === 1 ? "" : "s"} couldn't be updated.` };
  }
  return { updated: products.length };
}

export async function endAllSales(): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ sale_price: null, sale_ends_at: null })
    .eq("business_id", business.id)
    .not("sale_price", "is", null);

  if (error) return { error: `Couldn't end the sales: ${error.message}` };

  revalidateEverywhere();
  return {};
}
