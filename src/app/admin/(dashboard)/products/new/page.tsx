import type { Metadata } from "next";
import { requireBusinessContext } from "@/lib/dal";
import { getCategories } from "@/lib/queries/admin";
import { createProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const { business } = await requireBusinessContext();
  const categories = await getCategories(business.id);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-charcoal-900">New product</h1>
      <ProductForm categories={categories} action={createProduct} />
    </div>
  );
}
