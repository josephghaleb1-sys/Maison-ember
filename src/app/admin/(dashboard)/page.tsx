import Link from "next/link";
import type { Metadata } from "next";
import { UtensilsCrossed, Eye, Tags, Images, Plus } from "lucide-react";
import { requireBusinessContext } from "@/lib/dal";
import { getDashboardStats, getRecentProducts } from "@/lib/queries/admin";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Thumb } from "@/components/admin/thumb";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardOverviewPage() {
  const { business } = await requireBusinessContext();
  const [stats, recentProducts] = await Promise.all([
    getDashboardStats(business.id),
    getRecentProducts(business.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal-900">
          Welcome back
        </h1>
        <p className="text-sm text-charcoal-500">Here&apos;s what&apos;s happening at {business.name}.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total products" value={stats.totalProducts} icon={UtensilsCrossed} />
        <StatCard
          label="Visible on site"
          value={stats.visibleProducts}
          icon={Eye}
          hint={`${stats.totalProducts - stats.visibleProducts} hidden`}
        />
        <StatCard label="Categories" value={stats.totalCategories} icon={Tags} />
        <StatCard label="Media files" value={stats.totalMedia} icon={Images} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-3">
          <Link href="/admin/products/new">
            <Button size="sm">
              <Plus className="size-4" aria-hidden /> New product
            </Button>
          </Link>
          <Link href="/admin/categories">
            <Button size="sm" variant="outline">
              <Tags className="size-4" aria-hidden /> Manage categories
            </Button>
          </Link>
          <Link href="/admin/media">
            <Button size="sm" variant="outline">
              <Images className="size-4" aria-hidden /> Upload media
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button size="sm" variant="outline">
              Edit business info
            </Button>
          </Link>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recently added products</CardTitle>
          <Link href="/admin/products" className="text-sm font-medium text-ember-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardBody>
          {recentProducts.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No products yet"
              description="Add your first menu item to get your site up and running."
              action={
                <Link href="/admin/products/new">
                  <Button size="sm">
                    <Plus className="size-4" aria-hidden /> New product
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-charcoal-100">
              {recentProducts.map((product) => (
                <li key={product.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Thumb path={product.image_path} alt={product.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-charcoal-900">{product.name}</p>
                    <p className="text-sm text-charcoal-500">{formatPrice(product.price)}</p>
                  </div>
                  {!product.is_visible && <Badge variant="warning">Hidden</Badge>}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
