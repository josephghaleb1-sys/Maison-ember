import Link from "next/link";
import type { Metadata } from "next";
import {
  Eye,
  Tags,
  Images,
  Plus,
  Palette,
  Store,
  ExternalLink,
  Globe,
  Clock,
} from "lucide-react";
import { requireBusinessContext } from "@/lib/dal";
import {
  getBusinessDomains,
  getDashboardStats,
  getRecentChanges,
  getRecentProducts,
} from "@/lib/queries/admin";
import { getCatalogIcon } from "@/components/admin/nav-items";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Thumb } from "@/components/admin/thumb";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

/** Compact relative time ("3h ago") for the activity feed. Rendered on the
 * server from a stored timestamp, so there's no clock-skew hydration risk. */
function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.floor(days)}d ago`;
  return new Date(iso).toLocaleDateString();
}

const CHANGE_LABELS: Record<string, string> = {
  product: "Catalog",
  category: "Category",
  media: "Media",
};

export default async function DashboardOverviewPage() {
  const { business, type } = await requireBusinessContext();
  const [stats, recentProducts, recentChanges, domains] = await Promise.all([
    getDashboardStats(business.id),
    getRecentProducts(business.id),
    getRecentChanges(business.id),
    getBusinessDomains(business.id),
  ]);

  const CatalogIcon = getCatalogIcon(type.icon);
  const primaryDomain = domains.find((d) => d.is_primary) ?? domains[0];
  const isLive = stats.visibleProducts > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cream-50">Welcome back</h1>
          <p className="mt-1 text-sm text-charcoal-400">
            Here&apos;s what&apos;s happening at {business.name}.
          </p>
        </div>
        <Link href={primaryDomain ? `https://${primaryDomain.hostname}` : "/"} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="size-4" aria-hidden /> Preview website
          </Button>
        </Link>
      </div>

      {/* Website status */}
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-10 items-center justify-center rounded-lg ${
                isLive ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"
              }`}
            >
              <Globe className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-cream-50">
                {isLive ? "Your website is live" : "Your website has nothing to show yet"}
              </p>
              <p className="text-xs text-charcoal-400">
                {primaryDomain
                  ? primaryDomain.hostname
                  : "No custom domain connected yet — add one in Settings."}
              </p>
            </div>
          </div>
          {!isLive && (
            <Link href="/admin/products/new">
              <Button size="sm">
                <Plus className="size-4" aria-hidden /> Add your first {type.itemSingular}
              </Button>
            </Link>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={type.adminCatalogLabel} value={stats.totalProducts} icon={CatalogIcon} />
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
              <Plus className="size-4" aria-hidden /> Add {type.itemSingular}
            </Button>
          </Link>
          <Link href="/admin/website">
            <Button size="sm" variant="outline">
              <Palette className="size-4" aria-hidden /> Edit website
            </Button>
          </Link>
          <Link href="/admin/business">
            <Button size="sm" variant="outline">
              <Store className="size-4" aria-hidden /> Business info
            </Button>
          </Link>
          <Link href="/admin/media">
            <Button size="sm" variant="outline">
              <Images className="size-4" aria-hidden /> Upload media
            </Button>
          </Link>
          <Link href="/admin/categories">
            <Button size="sm" variant="outline">
              <Tags className="size-4" aria-hidden /> Manage categories
            </Button>
          </Link>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recently added</CardTitle>
            <Link
              href="/admin/products"
              className="text-sm font-medium text-accent-400 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardBody>
            {recentProducts.length === 0 ? (
              <EmptyState
                icon={CatalogIcon}
                title={`No ${type.itemPlural} yet`}
                description={`Add your first ${type.itemSingular} to get your website up and running.`}
                action={
                  <Link href="/admin/products/new">
                    <Button size="sm">
                      <Plus className="size-4" aria-hidden /> Add {type.itemSingular}
                    </Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-charcoal-800">
                {recentProducts.map((product) => (
                  <li key={product.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Thumb path={product.image_path} alt={product.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-cream-50">{product.name}</p>
                      <p className="text-sm text-charcoal-400">
                        {formatPrice(product.price, business.currency)}
                      </p>
                    </div>
                    {!product.is_visible && <Badge variant="warning">Hidden</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent changes</CardTitle>
          </CardHeader>
          <CardBody>
            {recentChanges.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Nothing changed yet"
                description="Edits you make to your catalog, categories and media will show up here."
              />
            ) : (
              <ul className="divide-y divide-charcoal-800">
                {recentChanges.map((change) => (
                  <li key={change.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Badge>{CHANGE_LABELS[change.kind] ?? change.kind}</Badge>
                    <span className="min-w-0 flex-1 truncate text-sm text-cream-50">
                      {change.label}
                    </span>
                    <span className="shrink-0 text-xs text-charcoal-500">{timeAgo(change.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
