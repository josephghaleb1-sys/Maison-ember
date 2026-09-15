import { priceView } from "@/lib/pricing";
import { toNumber } from "@/lib/utils";
import type { Product } from "@/lib/database.types";

/**
 * The slice of a product the cart UI needs. Kept deliberately small: it is
 * serialised into the page for every visit, and prices here are for *display
 * only* — the charged price is recomputed in the database when the order is
 * placed.
 */
export interface CatalogEntry {
  id: string;
  name: string;
  /** What the customer pays today — the sale price while a sale is running. */
  price: number;
  /** The normal price, present only while a sale is running. */
  wasPrice: number | null;
  imagePath: string | null;
}

export function toCatalogEntries(products: Product[]): CatalogEntry[] {
  return products.map((product) => {
    const view = priceView(product);
    return {
      id: product.id,
      name: product.name,
      price: view.current,
      wasPrice: view.was,
      imagePath: product.image_path,
    };
  });
}

export interface CartLineView extends CatalogEntry {
  quantity: number;
  lineTotal: number;
}

/**
 * Joins cart lines to the catalogue. Anything that has since been hidden or
 * deleted simply drops out — the order would be rejected for it anyway.
 */
export function buildCartView(
  lines: { productId: string; quantity: number }[],
  catalog: CatalogEntry[],
): { items: CartLineView[]; subtotal: number; missing: number } {
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const items: CartLineView[] = [];
  let missing = 0;

  for (const line of lines) {
    const entry = byId.get(line.productId);
    if (!entry) {
      missing += 1;
      continue;
    }
    const quantity = toNumber(line.quantity, 1);
    items.push({ ...entry, quantity, lineTotal: entry.price * quantity });
  }

  return {
    items,
    subtotal: items.reduce((total, item) => total + item.lineTotal, 0),
    missing,
  };
}

/** Delivery fee for a chosen zone, honouring the free-delivery threshold. */
export function resolveDeliveryFee(
  zoneFee: number | string | null,
  subtotal: number,
  freeOver: number | string | null,
): number {
  if (zoneFee === null) return 0;
  const fee = toNumber(zoneFee);
  const threshold = toNumber(freeOver, 0);
  if (threshold > 0 && subtotal >= threshold) return 0;
  return fee;
}
