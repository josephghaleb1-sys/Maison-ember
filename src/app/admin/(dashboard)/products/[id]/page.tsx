import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireBusinessContext } from "@/lib/dal";
import {
  getCategories,
  getProduct,
  getSelectableMedia,
  getWebsiteSettings,
} from "@/lib/queries/admin";
import { updateProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit item" };

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  const { business, preset } = await requireBusinessContext();
  const [product, categories, library, settings] = await Promise.all([
    getProduct(business.id, id),
    getCategories(business.id),
    getSelectableMedia(business.id),
    getWebsiteSettings(business.id),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold capitalize text-ink-50">
        Edit {preset.itemNoun}
      </h1>
      <ProductForm
        product={product}
        categories={categories}
        library={library}
        currency={settings?.currency || "USD"}
        itemNoun={preset.itemNoun}
        action={updateProduct.bind(null, id)}
      />
    </div>
  );
}
