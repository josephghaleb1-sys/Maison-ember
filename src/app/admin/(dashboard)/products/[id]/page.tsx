import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireBusinessContext } from "@/lib/dal";
import { getCategories, getProduct } from "@/lib/queries/admin";
import { updateProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  const { business } = await requireBusinessContext();
  const [product, categories] = await Promise.all([
    getProduct(business.id, id),
    getCategories(business.id),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-cream-50">Edit product</h1>
      <ProductForm product={product} categories={categories} action={updateProduct.bind(null, id)} />
    </div>
  );
}
