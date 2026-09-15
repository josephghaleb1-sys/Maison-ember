"use client";

import { useActionState, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Banknote, Loader2, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/components/site/cart/cart-context";
import { buildCartView, resolveDeliveryFee, type CatalogEntry } from "@/lib/cart";
import { placeOrder } from "@/lib/actions/orders";
import type { FormState } from "@/lib/actions/auth";
import type { DeliveryZone } from "@/lib/database.types";
import { getPublicMediaUrl } from "@/lib/storage";
import { formatPrice, toNumber } from "@/lib/utils";

const initialState: FormState = {};

function Field({
  label,
  name,
  required,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-400">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        className="block w-full rounded-xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-base text-ink-50 placeholder:text-ink-600 focus:border-accent focus:outline focus:outline-2 focus:outline-accent/40"
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export function CheckoutForm({
  catalog,
  zones,
  currency,
  freeDeliveryOver,
  minOrderTotal,
  orderNotice,
  catalogPath,
  catalogLabel,
}: {
  catalog: CatalogEntry[];
  zones: DeliveryZone[];
  currency: string;
  freeDeliveryOver: number | null;
  minOrderTotal: number;
  orderNotice: string;
  catalogPath: string;
  catalogLabel: string;
}) {
  const { lines, ready } = useCart();
  const [state, formAction, isPending] = useActionState(placeOrder, initialState);
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");

  const { items, subtotal } = useMemo(() => buildCartView(lines, catalog), [lines, catalog]);
  const zone = zones.find((candidate) => candidate.id === zoneId) ?? null;
  const deliveryFee = resolveDeliveryFee(zone ? zone.fee : null, subtotal, freeDeliveryOver);
  const total = subtotal + deliveryFee;
  const minimum = toNumber(minOrderTotal, 0);
  const belowMinimum = minimum > 0 && subtotal < minimum;

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20 text-ink-400">
        <Loader2 className="size-5 animate-spin" aria-hidden />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-ink-700 px-6 py-16 text-center">
        <ShoppingBag className="size-9 text-accent/60" aria-hidden />
        <p className="text-ink-300">Your cart is empty.</p>
        <Link
          href={catalogPath}
          className="rounded-full border border-accent/50 px-6 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent hover:text-on-accent"
        >
          Browse {catalogLabel.toLowerCase()}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      {/* The cart travels as ids + quantities only; prices are recalculated
          in the database when the order is placed. */}
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        )}
      />
      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="eyebrow text-accent">1 · Your details</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Full name"
                name="customer_name"
                required
                autoComplete="name"
                placeholder="Your name"
                maxLength={120}
              />
            </div>
            <Field
              label="Phone number"
              name="customer_phone"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="70 123 456"
              maxLength={40}
              hint="We call to confirm before delivery."
            />
            <Field
              label="Second number"
              name="customer_phone_alt"
              type="tel"
              inputMode="tel"
              placeholder="Optional"
              maxLength={40}
            />
            <div className="sm:col-span-2">
              <Field
                label="Email"
                name="customer_email"
                type="email"
                autoComplete="email"
                placeholder="Optional"
                maxLength={160}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="eyebrow text-accent">2 · Delivery address</h2>
          <div className="mt-5 space-y-5">
            <div>
              <label
                htmlFor="delivery_zone_id"
                className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-400"
              >
                Area <span className="text-accent">*</span>
              </label>
              <select
                id="delivery_zone_id"
                name="delivery_zone_id"
                required
                value={zoneId}
                onChange={(event) => setZoneId(event.target.value)}
                className="block w-full rounded-xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-base text-ink-50 focus:border-accent focus:outline focus:outline-2 focus:outline-accent/40"
              >
                {zones.length === 0 && <option value="">No delivery areas configured</option>}
                {zones.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} —{" "}
                    {toNumber(option.fee) > 0 ? formatPrice(option.fee, currency) : "Free"}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label="City / town"
                name="city"
                required
                autoComplete="address-level2"
                placeholder="e.g. Jounieh"
                maxLength={120}
              />
              <Field
                label="Building / floor"
                name="address_details"
                placeholder="Optional"
                maxLength={300}
              />
            </div>

            <Field
              label="Street address"
              name="address_line"
              required
              autoComplete="street-address"
              placeholder="Street, building name, nearby landmark"
              maxLength={300}
            />

            <div>
              <label
                htmlFor="notes"
                className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-400"
              >
                Order notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                maxLength={1000}
                placeholder="Anything we should know — a landmark, a preferred delivery time…"
                className="block w-full rounded-xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-base text-ink-50 placeholder:text-ink-600 focus:border-accent focus:outline focus:outline-2 focus:outline-accent/40"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="eyebrow text-accent">3 · Payment</h2>
          <label className="mt-5 flex cursor-pointer items-start gap-4 rounded-2xl border border-accent/40 bg-brand/10 p-5">
            <input
              type="radio"
              name="payment_method"
              value="cod"
              defaultChecked
              className="mt-1 accent-[var(--brand-secondary)]"
            />
            <span>
              <span className="flex items-center gap-2 font-medium text-ink-50">
                <Banknote className="size-4 text-accent" aria-hidden />
                Cash on delivery
              </span>
              <span className="mt-1 block text-sm text-ink-300">
                Pay the courier in cash when your order arrives. No card needed.
              </span>
            </span>
          </label>
        </section>
      </div>

      {/* Order summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
          <h2 className="font-display text-xl font-semibold text-ink-50">Order summary</h2>

          <ul className="mt-4 divide-y divide-ink-800">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                  {item.imagePath ? (
                    <Image
                      src={getPublicMediaUrl(item.imagePath)}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-accent/50">
                      <ShoppingBag className="size-4" aria-hidden />
                    </span>
                  )}
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-[0.625rem] font-semibold text-on-accent">
                    {item.quantity}
                  </span>
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-100">{item.name}</span>
                <span className="text-sm text-ink-300">
                  {formatPrice(item.lineTotal, currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-ink-800 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-400">Subtotal</dt>
              <dd className="text-ink-100">{formatPrice(subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">
                Delivery{zone ? ` · ${zone.name}` : ""}
              </dt>
              <dd className="text-ink-100">
                {deliveryFee === 0 ? "Free" : formatPrice(deliveryFee, currency)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink-800 pt-3">
              <dt className="text-sm uppercase tracking-[0.14em] text-ink-300">Total</dt>
              <dd className="font-display text-2xl text-accent">{formatPrice(total, currency)}</dd>
            </div>
          </dl>

          {belowMinimum && (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
              Minimum order is {formatPrice(minimum, currency)}. Add a little more to check
              out.
            </p>
          )}

          {state.error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || belowMinimum || zones.length === 0}
            className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold uppercase tracking-[0.16em] text-on-accent transition-colors hover:bg-accent-bright disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isPending ? "Placing order…" : "Confirm order"}
          </button>

          <ul className="mt-5 space-y-2 text-xs text-ink-400">
            <li className="flex items-center gap-2">
              <Truck className="size-3.5 text-accent/70" aria-hidden />
              {freeDeliveryOver
                ? `Free delivery over ${formatPrice(freeDeliveryOver, currency)}`
                : "Delivery fee shown above"}
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-accent/70" aria-hidden />
              No payment online — you pay on delivery
            </li>
          </ul>

          {orderNotice && (
            <p className="mt-4 border-t border-ink-800 pt-4 text-xs leading-relaxed text-ink-400">
              {orderNotice}
            </p>
          )}
        </div>
      </aside>
    </form>
  );
}
