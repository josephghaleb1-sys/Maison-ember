import { toNumber } from "@/lib/utils";

/**
 * What an item costs right now, and what it costs normally.
 *
 * This mirrors public.effective_price in the database exactly. The database is
 * the authority — it is what checkout charges — and this exists so the page a
 * customer reads shows the same number. If the two ever disagree, the database
 * wins and the customer pays the lower/current price it computes.
 */
export interface PriceView {
  /** What the customer pays today. */
  current: number;
  /** The normal price, present only while a sale is running. */
  was: number | null;
  onSale: boolean;
  /** Whole-percent discount, for the badge. */
  discountPercent: number;
}

export function priceView(input: {
  price: number | string;
  sale_price?: number | string | null;
  sale_ends_at?: string | null;
}): PriceView {
  const price = toNumber(input.price);
  const sale = input.sale_price === null || input.sale_price === undefined
    ? null
    : toNumber(input.sale_price);

  const expired = input.sale_ends_at
    ? new Date(input.sale_ends_at).getTime() <= Date.now()
    : false;

  const onSale = sale !== null && sale < price && !expired;

  return {
    current: onSale ? sale! : price,
    was: onSale ? price : null,
    onSale,
    discountPercent: onSale && price > 0 ? Math.round(((price - sale!) / price) * 100) : 0,
  };
}

/** Is this sale scheduled to end, and when, in words the owner can scan? */
export function saleEndsLabel(endsAt: string | null | undefined): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return null;
  const now = Date.now();
  if (end.getTime() <= now) return "ended";

  const hours = Math.round((end.getTime() - now) / 3_600_000);
  if (hours < 1) return "ends within the hour";
  if (hours < 24) return `ends in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `ends in ${days} day${days === 1 ? "" : "s"}`;
}
