"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/site/cart/cart-context";

/** Header cart trigger with a live item count. */
export function CartButton({ label = "Cart" }: { label?: string }) {
  const { count, ready, open } = useCart();

  return (
    <button
      type="button"
      onClick={open}
      aria-label={count > 0 ? `${label} (${count} items)` : label}
      className="relative flex size-10 items-center justify-center rounded-full border border-ink-700 text-ink-100 transition-colors hover:border-accent/60 hover:text-accent"
    >
      <ShoppingBag className="size-4.5" aria-hidden />
      {/* Only render the badge after the stored cart is read, so the server
          and client markup agree on the first paint. */}
      {ready && count > 0 && (
        <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-accent-solid px-1 text-[0.6875rem] font-semibold leading-5 text-on-accent">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
