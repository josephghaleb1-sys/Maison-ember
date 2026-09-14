import type { Metadata } from "next";
import { Tags } from "lucide-react";
import { requireBusinessContext } from "@/lib/dal";
import { getCategories, getProducts } from "@/lib/queries/admin";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NewCategoryForm } from "@/components/admin/new-category-form";
import { CategoryRow } from "@/components/admin/category-row";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const { business, preset } = await requireBusinessContext();
  const [categories, products] = await Promise.all([
    getCategories(business.id),
    getProducts(business.id),
  ]);

  const productCounts = new Map<string, number>();
  for (const product of products) {
    if (!product.category_id) continue;
    productCounts.set(product.category_id, (productCounts.get(product.category_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-50">Categories</h1>
        <p className="text-sm text-ink-400">
          Group your {preset.itemNounPlural}. Deleting a category never deletes the{" "}
          {preset.itemNounPlural} inside it — they simply become uncategorised.
        </p>
      </div>

      <Card>
        <CardBody className="space-y-5">
          <NewCategoryForm />
          {categories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="No categories yet"
              description={`Categories keep your ${preset.itemNounPlural} tidy and give visitors a way to browse.`}
            />
          ) : (
            <ul className="divide-y divide-ink-800">
              {categories.map((category, index) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  productCount={productCounts.get(category.id) ?? 0}
                  isFirst={index === 0}
                  isLast={index === categories.length - 1}
                />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
