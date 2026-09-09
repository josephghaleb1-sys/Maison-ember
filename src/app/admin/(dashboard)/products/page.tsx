import Link from "next/link";
import type { Metadata } from "next";
import { Plus, UtensilsCrossed } from "lucide-react";
import { requireBusinessContext } from "@/lib/dal";
import { getProducts, getCategories } from "@/lib/queries/admin";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductList } from "@/components/admin/product-list";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const { business } = await requireBusinessContext();
  const [products, categories] = await Promise.all([
    getProducts(business.id),
    getCategories(business.id),
  ]);

  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal-900">Products</h1>
          <p className="text-sm text-charcoal-500">{products.length} total</p>
        </div>
        <Link href="/admin/products/new">
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">New product</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardBody>
          {products.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No products yet"
              description="Add your first menu item — set a price, description, category, and photo."
              action={
                <Link href="/admin/products/new">
                  <Button size="sm">
                    <Plus className="size-4" aria-hidden /> New product
                  </Button>
                </Link>
              }
            />
          ) : (
            <ProductList products={products} categoryNames={categoryNames} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
