"use client";

import { useOptimistic } from "react";
import type { Product } from "@/lib/database.types";
import { ProductRow } from "@/components/admin/product-row";

export function ProductList({
  products,
  categoryNames,
  currency,
}: {
  products: Product[];
  categoryNames: Map<string, string>;
  currency: string;
}) {
  const [optimisticProducts, removeOptimistic] = useOptimistic(
    products,
    (state, removedId: string) => state.filter((p) => p.id !== removedId),
  );

  return (
    <ul className="divide-y divide-ink-800">
      {optimisticProducts.map((product, index) => (
        <ProductRow
          key={product.id}
          product={product}
          categoryName={product.category_id ? categoryNames.get(product.category_id) ?? null : null}
          isFirst={index === 0}
          isLast={index === optimisticProducts.length - 1}
          currency={currency}
          onOptimisticRemove={() => removeOptimistic(product.id)}
        />
      ))}
    </ul>
  );
}
