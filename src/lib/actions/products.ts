"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

  if (!(await assertCategoryBelongsToBusiness(supabase, business.id, parsed.data.category_id))) {
    return { error: "That category doesn't exist." };
  }

  let imagePath: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const result = await uploadBusinessImage(supabase, business.id, userId, "product", file);
    if ("error" in result) return { error: result.error };
    imagePath = result.path;
  }

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  const { error } = await supabase.from("products").insert({
    business_id: business.id,
    category_id: parsed.data.category_id,
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    is_visible: parsed.data.is_visible,
    image_path: imagePath,
    sort_order: count ?? 0,
  });

  if (error) {
    if (imagePath) await deleteBusinessImage(supabase, imagePath);
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

  if (!(await assertCategoryBelongsToBusiness(supabase, business.id, parsed.data.category_id))) {
    return { error: "That category doesn't exist." };
  }

  const { data: existing } = await supabase
    .from("products")
    .select("image_path")
    .eq("id", productId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!existing) {
    return { error: "Product not found." };
  }

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

  const { data: existing } = await supabase
    .from("products")
    .select("image_path")
    .eq("id", productId)
    .eq("business_id", business.id)
    .maybeSingle();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("business_id", business.id);

  if (error) {
    return { error: `Couldn't delete product: ${error.message}` };
  }

  if (existing?.image_path) await deleteBusinessImage(supabase, existing.image_path);

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
