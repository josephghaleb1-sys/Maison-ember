import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Clock } from "lucide-react";
import {
  getPublicCategories,
  getPublicGalleryMedia,
  getPublicProducts,
  getSiteContext,
} from "@/lib/business";
import { getPublicMediaUrl } from "@/lib/storage";
import { mapsUrl } from "@/lib/contact";
import { Hero } from "@/components/site/hero";
import { Marquee } from "@/components/site/marquee";
import { Flourish, Ornament } from "@/components/site/ornament";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteButton } from "@/components/site/site-button";
import { Reveal } from "@/components/site/reveal";

/** First day of the week that actually has hours set, so the homepage never
 * advertises "Today: —" for a business that left Monday blank. */
function firstListedHours(hours: Record<string, string | undefined> | undefined) {
  const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const labels: Record<string, string> = {
    mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
  };
  for (const day of order) {
    if (hours?.[day]) return `${labels[day]} · ${hours[day]}`;
  }
  return null;
}

export default async function HomePage() {
  const [{ business, settings, type, businessName }, categories, products, gallery] =
    await Promise.all([
      getSiteContext(),
      getPublicCategories(),
      getPublicProducts(),
      getPublicGalleryMedia(),
    ]);

  const catalogHref = `/${type.catalogSegment}`;
  const featured = products.slice(0, 4);
  const featuredGallery = gallery.slice(0, 6);
  const hoursLine = firstListedHours(settings?.hours);

  const paragraphs = (settings?.about_text ?? "").split(/\n+/).filter(Boolean);
  const aboutExcerpt = paragraphs[0] ?? "";
  // A drop cap needs its first letter separated from the rest of the sentence.
  const dropCap = aboutExcerpt.charAt(0);
  const aboutRest = aboutExcerpt.slice(1);

  // How many items sit in each visible category, for the collection cards.
  const countByCategory = new Map<string, number>();
  for (const product of products) {
    if (!product.category_id) continue;
    countByCategory.set(product.category_id, (countByCategory.get(product.category_id) ?? 0) + 1);
  }

  return (
    <>
      <Hero
        imagePath={settings?.hero_image_path ?? null}
        eyebrow={settings?.tagline || type.defaultTagline || undefined}
        title={settings?.hero_title?.trim() || businessName}
        subtitle={settings?.hero_subtitle?.trim() || ""}
        motif={type.motif}
      >
        <SiteButton href={catalogHref} size="lg">
          {type.ctaLabel} <ArrowRight className="size-4" aria-hidden />
        </SiteButton>
        <SiteButton href="/contact" size="lg" variant="outline">
          {type.visitLabel}
        </SiteButton>
      </Hero>

      {/* A moving band of the business's own collections — motion and content
          at once, with nothing invented. */}
      <Marquee items={categories.map((category) => category.name)} />

      {aboutExcerpt && (
        <section className="bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
            <Reveal>
              <SectionHeading eyebrow="Our story" title={`About ${businessName}`} align="center" />
            </Reveal>

            <Reveal delay={120} className="mt-10">
              <p className="mx-auto max-w-2xl text-center text-lg leading-[1.85] text-ink-muted">
                {/* Drop cap: a small typographic flourish that signals
                    "this is a place that cares about books" without any
                    business-specific content. */}
                <span
                  aria-hidden
                  className="float-left mr-3 mt-1.5 font-display text-6xl leading-[0.8] text-brand-ink"
                >
                  {dropCap}
                </span>
                {aboutRest.length > 400 ? `${aboutRest.slice(0, 400).trim()}…` : aboutRest}
              </p>
            </Reveal>

            <Reveal delay={200}>
              <Flourish className="mt-10" />
              <div className="mt-8 text-center">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-75"
                >
                  Read our story <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="border-y border-line bg-surface-1">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Featured" title={`From the ${type.catalogLabel.toLowerCase()}`} />
              <Link
                href={catalogHref}
                className="inline-flex items-center gap-1.5 pb-2 text-sm font-medium text-brand-ink transition-opacity hover:opacity-75"
              >
                See all {type.itemPlural} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Reveal>

            <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {featured.map((product, i) => (
                <Reveal key={product.id} delay={i * 90} className="h-full">
                  <ProductCard product={product} currency={business.currency} priority={i < 2} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <Reveal>
              <SectionHeading eyebrow="Browse" title="Find what you're looking for" align="center" />
            </Reveal>

            {/* Numbered cards rather than a row of pills: the collections are
                the main way into the catalog, so they get real weight. */}
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, i) => {
                const count = countByCategory.get(category.id) ?? 0;
                return (
                  <Reveal key={category.id} delay={i * 70} className="h-full">
                    <Link
                      href={`${catalogHref}#${category.id}`}
                      className="group flex h-full items-center gap-5 rounded-2xl border border-line bg-surface-1 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-line hover:bg-surface-2"
                    >
                      <span
                        aria-hidden
                        className="font-display text-3xl font-semibold text-brand/45 transition-colors duration-300 group-hover:text-brand"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg font-semibold text-ink">
                          {category.name}
                        </span>
                        {count > 0 && (
                          <span className="mt-0.5 block text-sm text-ink-faint">
                            {count} {count === 1 ? type.itemSingular : type.itemPlural}
                          </span>
                        )}
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 text-brand-ink transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden
                      />
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {featuredGallery.length > 0 && (
        <section className="border-y border-line bg-surface-1">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Gallery" title={`Inside ${businessName}`} />
              <Link
                href="/gallery"
                className="inline-flex items-center gap-1.5 pb-2 text-sm font-medium text-brand-ink transition-opacity hover:opacity-75"
              >
                View gallery <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Reveal>

            {/* First image spans two columns on desktop for an editorial,
                non-grid-like rhythm. */}
            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {featuredGallery.map((item, i) => (
                <Reveal
                  key={item.id}
                  delay={i * 70}
                  className={i === 0 ? "col-span-2 row-span-2" : undefined}
                >
                  <div className="group relative aspect-square overflow-hidden rounded-2xl bg-surface-2">
                    <Image
                      src={getPublicMediaUrl(item.storage_path)}
                      alt={item.alt_text || ""}
                      fill
                      sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-surface-2">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, var(--brand) 0 1px, transparent 1px 13px)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="hidden lg:block">
            <Ornament motif={type.motif} className="mx-auto max-w-[15rem] text-brand/55" />
          </Reveal>

          <Reveal delay={100} className="text-center lg:text-left">
            <SectionHeading eyebrow={type.visitLabel} title="Come see us" />
            <div className="mt-7 flex flex-col items-center gap-3 text-ink-muted lg:items-start">
              {settings?.address && (
                <p className="flex items-center gap-2.5">
                  <MapPin className="size-4 shrink-0 text-brand-ink" aria-hidden />
                  {settings.address}
                </p>
              )}
              {hoursLine && (
                <p className="flex items-center gap-2.5">
                  <Clock className="size-4 shrink-0 text-brand-ink" aria-hidden />
                  {hoursLine}
                </p>
              )}
            </div>
            <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
              <SiteButton href="/contact" size="lg">
                Contact &amp; hours
              </SiteButton>
              {settings?.address && (
                <a
                  href={mapsUrl(settings.address)!}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-13 items-center justify-center gap-2.5 rounded-full border border-brand-line px-7 text-base font-medium tracking-wide text-brand-ink transition-colors duration-300 hover:bg-brand-tint"
                >
                  Get directions
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
