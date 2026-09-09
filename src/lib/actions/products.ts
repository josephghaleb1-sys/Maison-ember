"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { productSchema } from "@/lib/validation/product";
import { uploadBusinessImage, deleteBusinessImage } from "@/lib/actions/upload";
import type { FormState } from "@/lib/actions/auth";

async function assertCategoryBelongsToBusiness(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  categoryId: string | null,
) {
  if (!categoryId) return true;
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("business_id", businessId)
    .maybeSingle();
  return Boolean(data);
}

export async function createProduct(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { business, userId } = await requireBusinessContext();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    category_id: formData.get("category_id"),
    is_visible: formData.get("is_visible") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const file = formData.get("image");
  const hasFile = file instanceof File && file.size > 0;

  // Category validation, the sort_order count, and the image upload are all
  // independent of each other — run them concurrently instead of one at a
  // time. This is the main lever for "adding a product with a photo feels
  // slow": these three round trips used to be fully sequential.
  const [categoryOk, countResult, uploadResult] = await Promise.all([
    assertCategoryBelongsToBusiness(supabase, business.id, parsed.data.category_id),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    hasFile ? uploadBusinessImage(supabase, business.id, userId, "product", file) : Promise.resolve(null),
  ]);

  const uploadedPath = uploadResult && "path" in uploadResult ? uploadResult.path : null;

  if (!categoryOk) {
    if (uploadedPath) await deleteBusinessImage(supabase, uploadedPath);
    return { error: "That category doesn't exist." };
  }

  if (uploadResult && "error" in uploadResult) {
    return { error: uploadResult.error };
  }

  const { error } = await supabase.from("products").insert({
    business_id: business.id,
    category_id: parsed.data.category_id,
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    is_visible: parsed.data.is_visible,
    image_path: uploadedPath,
    sort_order: countResult.count ?? 0,
  });

  if (error) {
    if (uploadedPath) await deleteBusinessImage(supabase, uploadedPath);
    return { error: `Couldn't create product: ${error.message}` };
  }

  revalidatePath("/admin/products");
  revalidatePath("/menu");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(
  productId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { business, userId } = await requireBusinessContext();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    category_id: formData.get("category_id"),
    is_visible: formData.get("is_visible") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();

  // Category validation doesn't depend on the existing row (or vice versa) —
  // fetch both concurrently.
  const [categoryOk, existingResult] = await Promise.all([
    assertCategoryBelongsToBusiness(supabase, business.id, parsed.data.category_id),
    supabase
      .from("products")
      .select("image_path")
      .eq("id", productId)
      .eq("business_id", business.id)
      .maybeSingle(),
  ]);

  if (!categoryOk) {
    return { error: "That category doesn't exist." };
  }

  const existing = existingResult.data;
  if (!existing) {
    return { error: "Product not found." };
  }

  // The new-image-upload / old-image-removal decision genuinely depends on
  // `existing.image_path`, so this part has to stay sequential.
  let imagePath = existing.image_path;
  const file = formData.get("image");
  const removeImage = formData.get("remove_image") === "on";

  if (file instanceof File && file.size > 0) {
    const result = await uploadBusinessImage(supabase, business.id, userId, "product", file);
    if ("error" in result) return { error: result.error };
    if (existing.image_path) await deleteBusinessImage(supabase, existing.image_path);
    imagePath = result.path;
  } else if (removeImage && existing.image_path) {
    await deleteBusinessImage(supabase, existing.image_path);
    imagePath = null;
  }

  const { error } = await supabase
    .from("products")
    .update({
      category_id: parsed.data.category_id,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      is_visible: parsed.data.is_visible,
      image_path: imagePath,
    })
    .eq("id", productId)
    .eq("business_id", business.id);

  if (error) {
    return { error: `Couldn't save product: ${error.message}` };
  }

  revalidatePath("/admin/products");
  revalidatePath("/menu");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(productId: string): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  // DELETE ... RETURNING in one round trip instead of SELECT-then-DELETE.
  const { data: deleted, error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("business_id", business.id)
    .select("image_path")
    .maybeSingle();

  if (error) {
    return { error: `Couldn't delete product: ${error.message}` };
  }

  // The product row is already gone — that's the operation the user is
  // waiting on. Cleaning up its storage file + media row is bookkeeping
  // that doesn't need to block the response; `after()` runs it once the
  // response has been sent (Vercel keeps the function alive via waitUntil),
  // so cleanup still reliably happens without making the user wait for it.
  const imagePath = deleted?.image_path;
  if (imagePath) {
    after(() => deleteBusinessImage(supabase, imagePath));
  }

  revalidatePath("/admin/products");
  revalidatePath("/menu");
  revalidatePath("/");
  return {};
}

export async function setProductVisibility(
  productId: string,
  isVisible: boolean,
): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ is_visible: isVisible })
    .eq("id", productId)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/menu");
  revalidatePath("/");
  return {};
}

export async function moveProduct(
  productId: string,
  direction: "up" | "down",
): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, sort_order")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true });

  if (!products) return { error: "Couldn't load products." };

  const index = products.findIndex((p) => p.id === productId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= products.length) return {};

  const current = products[index];
  const swap = products[swapIndex];

  const [{ error: error1 }, { error: error2 }] = await Promise.all([
    supabase
      .from("products")
      .update({ sort_order: swap.sort_order })
      .eq("id", current.id)
      .eq("business_id", business.id),
    supabase
      .from("products")
      .update({ sort_order: current.sort_order })
      .eq("id", swap.id)
      .eq("business_id", business.id),
  ]);

  if (error1 || error2) return { error: "Couldn't reorder products." };

  revalidatePath("/admin/products");
  revalidatePath("/menu");
  return {};
}
