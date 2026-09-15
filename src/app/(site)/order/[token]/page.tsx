import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, Phone } from "lucide-react";
import { getSiteContext } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { whatsappHref } from "@/lib/contact";
import { formatPrice, toNumber } from "@/lib/utils";
import { Section } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { ClearCartOnMount } from "@/components/site/cart/clear-cart-on-mount";
import { WhatsAppIcon } from "@/components/site/social-icons";
import type { OrderConfirmation } from "@/lib/database.types";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_LABELS: Record<string, string> = {
  new: "Received",
  confirmed: "Confirmed",
  preparing: "Being prepared",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * The customer's receipt. Orders are invisible to anonymous visitors at the
 * database level; this page reads exactly one order through
 * get_order_by_token(), which matches on the unguessable token in the URL.
 */
export default async function OrderConfirmationPage(props: PageProps<"/order/[token]">) {
  const { token } = await props.params;
  if (!UUID.test(token)) notFound();

  const [{ businessName, settings, preset }, supabase] = await Promise.all([
    getSiteContext(),
    createClient(),
  ]);

  const { data } = await supabase.rpc("get_order_by_token", { p_token: token });
  const order = data as OrderConfirmation | null;
  if (!order) notFound();

  const currency = order.currency || "USD";
  const whatsapp = whatsappHref(
    settings?.whatsapp || settings?.phone,
    `Hi ${businessName}! I just placed order #${order.order_number}.`,
  );

  return (
    <Section className="max-w-3xl pt-28 sm:pt-32">
      {/* The order is safely in the database now — empty the local cart. */}
      <ClearCartOnMount />

      <div className="flex flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full border border-accent/40 bg-brand/20 text-accent">
          <CheckCircle2 className="size-8" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-4xl font-semibold text-ink-50 sm:text-5xl">
          Thank you, {order.customer_name.split(" ")[0]}
        </h1>
        <p className="mt-3 text-ink-300">
          Order <span className="font-medium text-accent">#{order.order_number}</span> is with us.
          We&apos;ll call {order.customer_phone} to confirm before it ships.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink-500">
          Status: {STATUS_LABELS[order.status] ?? order.status}
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-ink-800 bg-ink-900/60 p-6">
        <ul className="divide-y divide-ink-800">
          {order.items.map((item, index) => (
            <li key={index} className="flex items-baseline justify-between gap-4 py-3">
              <span className="min-w-0 text-ink-100">
                {item.name}
                <span className="text-ink-500"> × {item.quantity}</span>
              </span>
              <span className="shrink-0 text-sm text-ink-300">
                {formatPrice(item.line_total, currency)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-ink-800 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-400">Subtotal</dt>
            <dd className="text-ink-100">{formatPrice(order.subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-400">
              Delivery{order.delivery_zone_name ? ` · ${order.delivery_zone_name}` : ""}
            </dt>
            <dd className="text-ink-100">
              {toNumber(order.delivery_fee) === 0
                ? "Free"
                : formatPrice(order.delivery_fee, currency)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-ink-800 pt-3">
            <dt className="uppercase tracking-[0.14em] text-ink-300">Pay on delivery</dt>
            <dd className="font-display text-2xl text-accent">
              {formatPrice(order.total, currency)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-800 p-5 text-sm">
          <h2 className="eyebrow text-accent">Delivering to</h2>
          <p className="mt-3 flex items-start gap-2 text-ink-200">
            <MapPin className="mt-0.5 size-4 shrink-0 text-accent/70" aria-hidden />
            <span>
              {order.address_line}
              {order.address_details && <>, {order.address_details}</>}
              <br />
              {[order.city, order.delivery_zone_name].filter(Boolean).join(", ")}
            </span>
          </p>
          <p className="mt-3 flex items-center gap-2 text-ink-200">
            <Phone className="size-4 shrink-0 text-accent/70" aria-hidden />
            {order.customer_phone}
          </p>
        </div>

        <div className="rounded-2xl border border-ink-800 p-5 text-sm">
          <h2 className="eyebrow text-accent">What happens next</h2>
          <ol className="mt-3 space-y-2 text-ink-300">
            <li>1. We call you to confirm the order.</li>
            <li>2. It ships with our courier.</li>
            <li>3. You pay cash when it arrives.</li>
          </ol>
          {settings?.order_notice && (
            <p className="mt-3 text-xs leading-relaxed text-ink-500">{settings.order_notice}</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {whatsapp && (
          <ButtonLink href={whatsapp} external size="lg">
            <WhatsAppIcon className="size-4" />
            Confirm on WhatsApp
          </ButtonLink>
        )}
        <ButtonLink href={preset.catalogPath} size="lg" variant="outline">
          Continue shopping
        </ButtonLink>
      </div>

      <p className="mt-6 text-center text-xs text-ink-500">
        Keep this page — it&apos;s your receipt. <Link href="/contact" className="underline hover:text-accent">Need help?</Link>
      </p>
    </Section>
  );
}
