import Image from "next/image";
import { Flame } from "lucide-react";
import type { Product } from "@/lib/database.types";
import { getPublicMediaUrl } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex gap-4 rounded-xl border border-charcoal-900/5 bg-white/60 p-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-charcoal-100 sm:size-24">
        {product.image_path ? (
          <Image
            src={getPublicMediaUrl(product.image_path)}
            alt={product.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ember-300">
            <Flame className="size-8" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-charcoal-900">{product.name}</h3>
          <span className="shrink-0 font-medium text-ember-700">{formatPrice(product.price)}</span>
        </div>
        {product.description && (
          <p className="mt-1 text-sm text-charcoal-600">{product.description}</p>
        )}
      </div>
    </article>
  );
}
