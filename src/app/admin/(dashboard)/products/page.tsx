import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requireBusinessContext } from "@/lib/dal";
import { getProducts, getCategories } from "@/lib/queries/admin";
import { getCatalogIcon } from "@/components/admin/nav-items";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductList } from "@/components/admin/product-list";

export const metadata: Metadata = { title: "Catalog" };

export default async function ProductsPage() {
  const { business, type } = await requireBusinessContext();
  const [products, categories] = await Promise.all([
    getProducts(business.id),
    getCategories(business.id),
  ]);

  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const CatalogIcon = getCatalogIcon(type.icon);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cream-50">
            {type.adminCatalogLabel}
          </h1>
          <p className="text-sm text-charcoal-400">
            {products.length} {products.length === 1 ? type.itemSingular : type.itemPlural}
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Add {type.itemSingular}</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardBody>
          {products.length === 0 ? (
            <EmptyState
              icon={CatalogIcon}
              title={`No ${type.itemPlural} yet`}
              description={`Add your first ${type.itemSingular} — set a price, description, category and photo.`}
              action={
                <Link href="/admin/products/new">
                  <Button size="sm">
                    <Plus className="size-4" aria-hidden /> Add {type.itemSingular}
                  </Button>
                </Link>
              }
            />
          ) : (
            <ProductList
              products={products}
              categoryNames={categoryNames}
              currency={business.currency}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
