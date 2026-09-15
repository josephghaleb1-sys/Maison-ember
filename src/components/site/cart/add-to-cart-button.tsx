"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useCart } from "@/components/site/cart/cart-context";
import { cn } from "@/lib/utils";

/**
 * Adds one unit and opens the cart. Shows a brief "added" state instead of a
 * toast — the public site ships no toast library.
 */
export function AddToCartButton({
  productId,
  productName,
  className,
  variant = "compact",
}: {
  productId: string;
  productName: string;
  className?: string;
  variant?: "compact" | "full";
}) {
  const { add, open } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    add(productId, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
    open();
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-accent-bright",
          className,
        )}
      >
        {justAdded ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
        {justAdded ? "Added" : "Add to cart"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Add ${productName} to cart`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-ink-700 px-3 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-200 transition-colors hover:border-accent/60 hover:text-accent",
        className,
      )}
    >
      {justAdded ? <Check className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
      {justAdded ? "Added" : "Add"}
    </button>
  );
}
