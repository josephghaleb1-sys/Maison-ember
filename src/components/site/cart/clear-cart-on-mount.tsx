"use client";

import { useEffect } from "react";
import { useCart } from "@/components/site/cart/cart-context";

/**
 * Empties the cart once the order exists in the database — rendered only on
 * the confirmation page, so a failed submission never loses the cart.
 */
export function ClearCartOnMount() {
  const { clear, lines } = useCart();

  useEffect(() => {
    if (lines.length > 0) clear();
    // Runs once on mount: clearing is idempotent and must not re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
