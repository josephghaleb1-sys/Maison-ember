import type { Metadata } from "next";
import { requireBusinessContext } from "@/lib/dal";
import { getCategories } from "@/lib/queries/admin";
import { createProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New item" };

export default async function NewProductPage() {
  const { business, type } = await requireBusinessContext();
  const categories = await getCategories(business.id);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold capitalize text-cream-50">
        New {type.itemSingular}
      </h1>
      <ProductForm
        categories={categories}
        action={createProduct}
        itemSingular={type.itemSingular}
        currency={business.currency}
      />
    </div>
  );
}
