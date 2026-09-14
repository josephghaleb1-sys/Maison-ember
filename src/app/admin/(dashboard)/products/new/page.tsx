import type { Metadata } from "next";
import { requireBusinessContext } from "@/lib/dal";
import { getCategories, getSelectableMedia, getWebsiteSettings } from "@/lib/queries/admin";
import { createProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New item" };

export default async function NewProductPage() {
  const { business, preset } = await requireBusinessContext();
  const [categories, library, settings] = await Promise.all([
    getCategories(business.id),
    getSelectableMedia(business.id),
    getWebsiteSettings(business.id),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold capitalize text-ink-50">
        New {preset.itemNoun}
      </h1>
      <ProductForm
        categories={categories}
        library={library}
        currency={settings?.currency || "USD"}
        itemNoun={preset.itemNoun}
        action={createProduct}
      />
    </div>
  );
}
