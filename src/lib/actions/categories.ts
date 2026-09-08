"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { categorySchema } from "@/lib/validation/category";

function revalidateAll() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function createCategory(formData: FormData): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();

  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  const { error } = await supabase.from("categories").insert({
    business_id: business.id,
    name: parsed.data.name,
    sort_order: count ?? 0,
  });

  if (error) return { error: `Couldn't create category: ${error.message}` };

  revalidateAll();
  return {};
}

export async function renameCategory(categoryId: string, name: string): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();

  const parsed = categorySchema.shape.name.safeParse(name);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid name." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data })
    .eq("id", categoryId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't rename category: ${error.message}` };

  revalidateAll();
  return {};
}

export async function setCategoryVisibility(
  categoryId: string,
  isVisible: boolean,
): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({ is_visible: isVisible })
    .eq("id", categoryId)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidateAll();
  return {};
}

/** Deleting a category never deletes its products — the FK is ON DELETE SET
 * NULL, so products just become uncategorized. */
export async function deleteCategory(categoryId: string): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't delete category: ${error.message}` };

  revalidateAll();
  return {};
}

export async function moveCategory(
  categoryId: string,
  direction: "up" | "down",
): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, sort_order")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true });

  if (!categories) return { error: "Couldn't load categories." };

  const index = categories.findIndex((c) => c.id === categoryId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= categories.length) return {};

  const current = categories[index];
  const swap = categories[swapIndex];

  const [{ error: error1 }, { error: error2 }] = await Promise.all([
    supabase
      .from("categories")
      .update({ sort_order: swap.sort_order })
      .eq("id", current.id)
      .eq("business_id", business.id),
    supabase
      .from("categories")
      .update({ sort_order: current.sort_order })
      .eq("id", swap.id)
      .eq("business_id", business.id),
  ]);

  if (error1 || error2) return { error: "Couldn't reorder categories." };

  revalidateAll();
  return {};
}
