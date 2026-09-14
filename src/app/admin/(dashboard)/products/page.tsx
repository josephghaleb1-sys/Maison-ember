import type { Metadata } from "next";
import { Plus, ShoppingBag } from "lucide-react";
import { requireBusinessContext } from "@/lib/dal";
import { getProducts, getCategories, getWebsiteSettings } from "@/lib/queries/admin";
import { Card, CardBody } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductList } from "@/components/admin/product-list";

export const metadata: Metadata = { title: "Catalogue" };

export default async function ProductsPage() {
  const { business, preset } = await requireBusinessContext();
  const [products, categories, settings] = await Promise.all([
    getProducts(business.id),
    getCategories(business.id),
    getWebsiteSettings(business.id),
  ]);

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const hidden = products.filter((product) => !product.is_visible).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-50">{preset.adminLabel}</h1>
          <p className="text-sm text-ink-400">
            {products.length} total{hidden > 0 && ` · ${hidden} hidden`}
          </p>
        </div>
        <ButtonLink href="/admin/products/new" size="sm">
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline capitalize">New {preset.itemNoun}</span>
        </ButtonLink>
      </div>

      <Card>
        <CardBody>
          {products.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={`No ${preset.itemNounPlural} yet`}
              description={`Add your first ${preset.itemNoun} — name, price, description and a photo.`}
              action={
                <ButtonLink href="/admin/products/new" size="sm">
                  <Plus className="size-4" aria-hidden />
                  <span className="capitalize">New {preset.itemNoun}</span>
                </ButtonLink>
              }
            />
          ) : (
            <ProductList
              products={products}
              categoryNames={categoryNames}
              currency={settings?.currency || "USD"}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
