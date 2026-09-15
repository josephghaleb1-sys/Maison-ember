import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getPublicDeliveryZones,
  getPublicProducts,
  getSiteContext,
} from "@/lib/business";
import { toCatalogEntries } from "@/lib/cart";
import { CheckoutForm } from "@/components/site/checkout-form";
import { Section } from "@/components/site/section";

export const metadata: Metadata = {
  title: "Checkout",
  // A cart page has nothing to offer a search engine.
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [{ businessName, settings, preset }, products, zones] = await Promise.all([
    getSiteContext(),
    getPublicProducts(),
    getPublicDeliveryZones(),
  ]);

  // The owner can close ordering from the dashboard; when they do, the route
  // shouldn't exist at all.
  if (settings && !settings.checkout_enabled) notFound();

  return (
    <Section className="pt-28 sm:pt-32">
      <div className="mb-10">
        <Link
          href={preset.catalogPath}
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-400 transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Continue shopping
        </Link>
        <h1 className="mt-5 font-display text-4xl font-semibold text-ink-50 sm:text-5xl">
          Checkout
        </h1>
        <p className="mt-3 text-ink-300">
          Cash on delivery — {businessName} calls to confirm every order.
        </p>
      </div>

      <CheckoutForm
        catalog={toCatalogEntries(products)}
        zones={zones}
        currency={settings?.currency || "USD"}
        freeDeliveryOver={settings?.free_delivery_over ?? null}
        minOrderTotal={settings?.min_order_total ?? 0}
        orderNotice={settings?.order_notice ?? ""}
        catalogPath={preset.catalogPath}
        catalogLabel={preset.catalogLabel}
        whishEnabled={(settings?.whish_enabled ?? false) && Boolean(settings?.whish_number)}
        whishNumber={settings?.whish_number ?? ""}
        whishNote={settings?.whish_note ?? ""}
      />
    </Section>
  );
}
