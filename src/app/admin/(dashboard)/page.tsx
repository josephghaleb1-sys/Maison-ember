import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList,
  Eye,
  Images,
  Palette,
  Plus,
  ShoppingBag,
  Star,
} from "lucide-react";
import { requireBusinessContext } from "@/lib/dal";
import {
  getDashboardStats,
  getDeliveryZones,
  getRecentProducts,
  getWebsiteSettings,
} from "@/lib/queries/admin";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Thumb } from "@/components/admin/thumb";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

/** Nudges the owner toward whatever is still missing from their site. */
function buildChecklist(input: {
  hasProducts: boolean;
  hasCategories: boolean;
  hasMedia: boolean;
  hasLogo: boolean;
  hasAbout: boolean;
  hasDeliveryZones: boolean;
  itemNounPlural: string;
}) {
  return [
    { done: input.hasProducts, label: `Add your ${input.itemNounPlural}`, href: "/admin/products" },
    { done: input.hasCategories, label: "Group them into categories", href: "/admin/categories" },
    { done: input.hasMedia, label: "Upload photos", href: "/admin/media" },
    {
      done: input.hasDeliveryZones,
      label: "Set your delivery areas and fees",
      href: "/admin/delivery",
    },
    { done: input.hasLogo, label: "Add your logo and colours", href: "/admin/website" },
    { done: input.hasAbout, label: "Write your About text", href: "/admin/settings" },
  ];
}

export default async function DashboardOverviewPage() {
  const { business, preset } = await requireBusinessContext();
  const [stats, recentProducts, settings, zones] = await Promise.all([
    getDashboardStats(business.id),
    getRecentProducts(business.id),
    getWebsiteSettings(business.id),
    getDeliveryZones(business.id),
  ]);

  const currency = settings?.currency || "USD";
  const checklist = buildChecklist({
    hasProducts: stats.totalProducts > 0,
    hasCategories: stats.totalCategories > 0,
    hasMedia: stats.totalMedia > 0,
    hasLogo: Boolean(settings?.logo_path),
    hasAbout: Boolean(settings?.about_text),
    hasDeliveryZones: zones.length > 0,
    itemNounPlural: preset.itemNounPlural,
  });
  const remaining = checklist.filter((item) => !item.done);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-50">Welcome back</h1>
        <p className="text-sm text-ink-400">
          Here&apos;s how {settings?.business_name || business.name} is looking.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="New orders"
          value={stats.newOrders}
          icon={ClipboardList}
          hint={stats.newOrders > 0 ? "Waiting to be confirmed" : "All caught up"}
        />
        <StatCard
          label={`Total ${preset.itemNounPlural}`}
          value={stats.totalProducts}
          icon={ShoppingBag}
        />
        <StatCard
          label="Live on the site"
          value={stats.visibleProducts}
          icon={Eye}
          hint={`${stats.totalProducts - stats.visibleProducts} hidden`}
        />
        <StatCard
          label="Photos"
          value={stats.totalMedia}
          icon={Images}
          hint={`${stats.totalCategories} categories · ${stats.totalTestimonials} reviews`}
        />
      </div>

      {stats.newOrders > 0 && (
        <Link
          href="/admin/orders"
          className="flex items-center justify-between gap-4 rounded-xl border border-accent/40 bg-accent/10 px-5 py-4 transition-colors hover:bg-accent/15"
        >
          <span className="text-sm text-ink-100">
            <span className="font-semibold text-accent">
              {stats.newOrders} new {stats.newOrders === 1 ? "order" : "orders"}
            </span>{" "}
            waiting to be confirmed.
          </span>
          <span className="shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-accent">
            Open orders →
          </span>
        </Link>
      )}

      {remaining.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Finish setting up</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2.5">
              {checklist.map((item) => (
                <li key={item.href} className="flex items-center gap-3 text-sm">
                  <span
                    className={
                      item.done
                        ? "flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[0.65rem] text-accent"
                        : "flex size-5 shrink-0 items-center justify-center rounded-full border border-ink-600 text-ink-500"
                    }
                    aria-hidden
                  >
                    {item.done ? "✓" : ""}
                  </span>
                  <Link
                    href={item.href}
                    className={
                      item.done
                        ? "text-ink-500 line-through"
                        : "text-ink-100 underline-offset-4 hover:text-accent hover:underline"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-3">
          <ButtonLink href="/admin/products/new" size="sm">
            <Plus className="size-4" aria-hidden />
            <span className="capitalize">New {preset.itemNoun}</span>
          </ButtonLink>
          <ButtonLink href="/admin/orders" size="sm" variant="outline">
            <ClipboardList className="size-4" aria-hidden /> View orders
          </ButtonLink>
          <ButtonLink href="/admin/website" size="sm" variant="outline">
            <Palette className="size-4" aria-hidden /> Edit website
          </ButtonLink>
          <ButtonLink href="/admin/media" size="sm" variant="outline">
            <Images className="size-4" aria-hidden /> Upload photos
          </ButtonLink>
          <ButtonLink href="/admin/testimonials" size="sm" variant="outline">
            <Star className="size-4" aria-hidden /> Add a review
          </ButtonLink>
          <ButtonLink href="/admin/settings" size="sm" variant="outline">
            Business info
          </ButtonLink>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recently added</CardTitle>
          <Link href="/admin/products" className="text-sm font-medium text-accent hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardBody>
          {recentProducts.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={`No ${preset.itemNounPlural} yet`}
              description={`Add your first ${preset.itemNoun} to get your site up and running.`}
              action={
                <ButtonLink href="/admin/products/new" size="sm">
                  <Plus className="size-4" aria-hidden />
                  <span className="capitalize">New {preset.itemNoun}</span>
                </ButtonLink>
              }
            />
          ) : (
            <ul className="divide-y divide-ink-800">
              {recentProducts.map((product) => (
                <li key={product.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Thumb path={product.image_path} alt={product.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-50">{product.name}</p>
                    <p className="text-sm text-ink-400">{formatPrice(product.price, currency)}</p>
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
