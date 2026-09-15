import type { Product } from "@/lib/database.types";
import { priceView } from "@/lib/pricing";
import { formatPrice, cn } from "@/lib/utils";

/**
 * A price, with the old one struck through while a sale is running.
 *
 * The sale rule lives in one place (src/lib/pricing.ts) and mirrors the
 * database function that checkout actually charges, so what a customer reads
 * and what they pay cannot disagree.
 */
export function Price({
  product,
  currency,
  className,
  size = "md",
}: {
  product: Pick<Product, "price" | "sale_price" | "sale_ends_at">;
  currency: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const view = priceView(product);

  if (!view.onSale) {
    return (
      <span className={cn("font-medium text-accent", className)}>
        {formatPrice(view.current, currency)}
      </span>
    );
  }

  return (
    <span className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className="font-medium text-accent">{formatPrice(view.current, currency)}</span>
      <span
        className={cn("text-ink-500 line-through", size === "sm" ? "text-xs" : "text-sm")}
      >
        {formatPrice(view.was!, currency)}
      </span>
    </span>
  );
}

/** The corner flag on a discounted card. */
export function SaleBadge({
  product,
  className,
}: {
  product: Pick<Product, "price" | "sale_price" | "sale_ends_at">;
  className?: string;
}) {
  const view = priceView(product);
  if (!view.onSale) return null;

  return (
    <span
      className={cn(
        "rounded-full bg-accent-solid px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-on-accent shadow-sm",
        className,
      )}
    >
      −{view.discountPercent}%
    </span>
  );
}
