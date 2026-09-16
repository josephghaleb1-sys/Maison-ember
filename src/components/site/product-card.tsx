import Image from "next/image";
import type { Product } from "@/lib/database.types";
import { getPublicMediaUrl } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";

/**
 * One catalog item. Used for books, dishes, services — whatever the tenant
 * sells — so it carries no industry-specific wording or iconography.
 */
export function ProductCard({
  product,
  currency,
  priority = false,
}: {
  product: Product;
  currency: string;
  /** Set on above-the-fold cards so their images aren't lazy-loaded. */
  priority?: boolean;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-1 transition-colors duration-300 hover:border-brand-line">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        {product.image_path ? (
          <Image
            src={getPublicMediaUrl(product.image_path)}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          // Monogram placeholder — deliberate-looking while an owner is still
          // uploading photos, and themed so it never looks like a broken image.
          <div
            className="flex size-full items-center justify-center"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, var(--brand-tint) 0 1px, transparent 1px 12px)",
            }}
            aria-hidden
          >
            <span className="font-display text-4xl font-semibold text-brand/40">
              {product.name.trim().charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold leading-snug text-ink">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">
            {product.description}
          </p>
        )}
        <p className="mt-4 font-medium tracking-wide text-brand">
          {formatPrice(product.price, currency)}
        </p>
      </div>
    </article>
  );
}
