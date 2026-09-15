"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/components/site/cart/cart-context";
import { buildCartView, type CatalogEntry } from "@/lib/cart";
import { getPublicMediaUrl } from "@/lib/storage";
import { formatPrice, toNumber } from "@/lib/utils";

/**
 * Slide-over cart. Rendered once in the site layout so it is available on
 * every page, and mounted only when open so it costs nothing while closed.
 */
export function CartDrawer({
  catalog,
  currency,
  checkoutEnabled,
  freeDeliveryOver,
  catalogPath,
  catalogLabel,
}: {
  catalog: CatalogEntry[];
  currency: string;
  checkoutEnabled: boolean;
  freeDeliveryOver: number | string | null;
  catalogPath: string;
  catalogLabel: string;
}) {
  const { lines, isOpen, close, setQuantity, remove } = useCart();
  const { items, subtotal } = buildCartView(lines, catalog);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const threshold = toNumber(freeDeliveryOver, 0);
  const remaining = threshold > subtotal ? threshold - subtotal : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-ink-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Your cart"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <aside className="flex h-full w-full max-w-md flex-col border-l border-accent/20 bg-ink-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-ink-50">Your cart</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="flex size-9 items-center justify-center rounded-full border border-ink-700 text-ink-200 transition-colors hover:border-accent/60 hover:text-accent"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <ShoppingBag className="size-10 text-accent/50" aria-hidden />
            <p className="text-ink-300">Your cart is empty.</p>
            <Link
              href={catalogPath}
              onClick={close}
              className="rounded-full border border-accent/50 px-5 py-2 text-xs font-medium uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent-solid hover:text-on-accent"
            >
              Browse {catalogLabel.toLowerCase()}
            </Link>
          </div>
        ) : (
          <>
            <ul className="min-h-0 flex-1 divide-y divide-ink-800 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <div className="relative size-18 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                    {item.imagePath ? (
                      <Image
                        src={getPublicMediaUrl(item.imagePath)}
                        alt={item.name}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-accent/50">
                        <ShoppingBag className="size-5" aria-hidden />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-50">{item.name}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {formatPrice(item.price, currency)} each
                      {item.wasPrice !== null && (
                        <span className="ml-1.5 text-ink-500 line-through">
                          {formatPrice(item.wasPrice, currency)}
                        </span>
                      )}
                    </p>

                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-ink-700">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          aria-label={`Remove one ${item.name}`}
                          className="flex size-8 items-center justify-center rounded-l-full text-ink-300 transition-colors hover:text-accent"
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <span className="min-w-8 text-center text-sm text-ink-50" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          aria-label={`Add one ${item.name}`}
                          className="flex size-8 items-center justify-center rounded-r-full text-ink-300 transition-colors hover:text-accent"
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="text-ink-500 transition-colors hover:text-red-400"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>

                  <p className="shrink-0 text-sm font-medium text-accent">
                    {formatPrice(item.lineTotal, currency)}
                  </p>
                </li>
              ))}
            </ul>

            <footer className="border-t border-ink-800 px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-300">Subtotal</span>
                <span className="font-display text-2xl text-ink-50">
                  {formatPrice(subtotal, currency)}
                </span>
              </div>
              {remaining > 0 && (
                <p className="mt-2 text-xs text-accent/90">
                  Spend {formatPrice(remaining, currency)} more for free delivery.
                </p>
              )}
              <p className="mt-1 text-xs text-ink-500">Delivery is calculated at checkout.</p>

              {checkoutEnabled ? (
                <Link
                  href="/checkout"
                  onClick={close}
                  className="mt-4 flex h-12 items-center justify-center rounded-full bg-accent-solid text-sm font-semibold uppercase tracking-[0.16em] text-on-accent transition-colors hover:bg-accent-bright"
                >
                  Checkout
                </Link>
              ) : (
                <p className="mt-4 rounded-xl border border-ink-800 p-3 text-center text-sm text-ink-300">
                  Online ordering is closed right now — message us to order.
                </p>
              )}
              <button
                type="button"
                onClick={close}
                className="mt-2 w-full py-2 text-center text-xs uppercase tracking-[0.16em] text-ink-400 transition-colors hover:text-accent"
              >
                Continue shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
