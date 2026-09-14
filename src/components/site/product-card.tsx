import Image from "next/image";
import { Sparkles } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/social-icons";
import type { Product } from "@/lib/database.types";
import { getPublicMediaUrl } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import { Tilt } from "@/components/site/tilt";

/**
 * Deterministic 0-1 value from an id — used to vary the placeholder gradient
 * so a catalogue without photos yet doesn't look like a repeated tile.
 */
function seedFrom(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 997;
  return hash / 997;
}

function placeholderBackground(id: string): string {
  const seed = seedFrom(id);
  const x = 30 + seed * 40;
  const y = 28 + (1 - seed) * 30;
  const strength = 42 + seed * 26;
  return `radial-gradient(70% 60% at ${x}% ${y}%, color-mix(in oklab, var(--brand-primary) ${strength}%, #0b0709), #0b0709)`;
}

interface ProductCardProps {
  product: Product;
  currency: string;
  showPrice: boolean;
  /** Extra label under the name, e.g. its category. */
  categoryName?: string;
  priority?: boolean;
  /**
   * Pre-filled WhatsApp enquiry link. Only rendered when the business has a
   * WhatsApp number saved — plenty of businesses take orders by message
   * rather than running a checkout.
   */
  orderHref?: string | null;
}

/**
 * Photo-led card — the right shape for products, retail and packages.
 * Hover lifts it in 3D (see <Tilt/>) and drifts a light across the photo;
 * both are transform/opacity only, so they stay on the compositor.
 */
export function ProductCard({
  product,
  currency,
  showPrice,
  categoryName,
  priority = false,
  orderHref,
}: ProductCardProps) {
  return (
    <Tilt className="h-full">
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/70 transition-colors duration-500 hover:border-accent/40">
        <div className="relative aspect-[4/5] overflow-hidden bg-ink-900">
          {product.image_path ? (
            <Image
              src={getPublicMediaUrl(product.image_path)}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105 motion-reduce:transition-none"
            />
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={{ background: placeholderBackground(product.id) }}
            >
              <Sparkles className="size-8 text-accent/50" aria-hidden />
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent"
            aria-hidden
          />
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
          {categoryName && <p className="eyebrow text-accent/80">{categoryName}</p>}
          <h3 className="font-display text-xl font-semibold leading-snug text-ink-50">
            {product.name}
          </h3>
          {product.description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-ink-300">{product.description}</p>
          )}
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            {showPrice ? (
              <p className="text-sm font-medium tracking-wide text-accent">
                {formatPrice(product.price, currency)}
              </p>
            ) : (
              <span />
            )}
            {orderHref && (
              <a
                href={orderHref}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 px-3 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-200 transition-colors hover:border-accent/60 hover:text-accent"
              >
                <WhatsAppIcon className="size-3.5" />
                Order
              </a>
            )}
          </div>
        </div>
      </article>
    </Tilt>
  );
}

/**
 * Compact row — the right shape for menus and service lists, where people
 * scan names and prices rather than photographs.
 */
export function ProductRowCard({ product, currency, showPrice, orderHref }: ProductCardProps) {
  return (
    <article className="group flex gap-4 rounded-xl border border-ink-800 bg-ink-900/60 p-4 transition-colors duration-300 hover:border-accent/40">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-ink-900 sm:size-24">
        {product.image_path ? (
          <Image
            src={getPublicMediaUrl(product.image_path)}
            alt={product.name}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-accent/60">
            <Sparkles className="size-7" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-ink-50">{product.name}</h3>
          {showPrice && (
            <span className="shrink-0 text-sm font-medium text-accent">
              {formatPrice(product.price, currency)}
            </span>
          )}
        </div>
        {product.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-ink-300">{product.description}</p>
        )}
        {orderHref && (
          <a
            href={orderHref}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-400 transition-colors hover:text-accent"
          >
            <WhatsAppIcon className="size-3.5" />
            Enquire
          </a>
        )}
      </div>
    </article>
  );
}
