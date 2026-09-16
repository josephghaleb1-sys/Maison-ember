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
  const aboutExcerpt = (settings?.about_text ?? "").split(/\n+/).filter(Boolean)[0] ?? "";

  return (
    <>
      <Hero
        imagePath={settings?.hero_image_path ?? null}
        eyebrow={settings?.tagline || type.defaultTagline || undefined}
        title={settings?.hero_title?.trim() || businessName}
        subtitle={settings?.hero_subtitle?.trim() || ""}
      >
        <SiteButton href={catalogHref} size="lg">
          {type.ctaLabel} <ArrowRight className="size-4" aria-hidden />
        </SiteButton>
        <SiteButton href="/contact" size="lg" variant="quiet">
          {type.visitLabel}
        </SiteButton>
      </Hero>

      {aboutExcerpt && (
        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
            <Reveal>
              <SectionHeading eyebrow="Our story" title={`About ${businessName}`} align="center" />
              <p className="mt-6 text-lg leading-relaxed text-ink-muted">
                {aboutExcerpt.length > 360 ? `${aboutExcerpt.slice(0, 360).trim()}…` : aboutExcerpt}
              </p>
              <Link
                href="/about"
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-opacity hover:opacity-75"
              >
                Read our story <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="bg-surface-1">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Featured" title={`From the ${type.catalogLabel.toLowerCase()}`} />
              <Link
                href={catalogHref}
                className="inline-flex items-center gap-1.5 pb-2 text-sm font-medium text-brand transition-opacity hover:opacity-75"
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
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
            <Reveal>
              <SectionHeading eyebrow="Browse" title="Find what you're looking for" align="center" />
            </Reveal>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {categories.map((category, i) => (
                <Reveal key={category.id} delay={i * 60}>
                  <Link
                    href={`${catalogHref}#${category.id}`}
                    className="inline-flex rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink-muted transition-colors duration-300 hover:border-brand-line hover:text-brand"
                  >
                    {category.name}
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredGallery.length > 0 && (
        <section className="bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Gallery" title={`Inside ${businessName}`} />
              <Link
                href="/gallery"
                className="inline-flex items-center gap-1.5 pb-2 text-sm font-medium text-brand transition-opacity hover:opacity-75"
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
                  <div
                    className={`group relative overflow-hidden rounded-2xl bg-surface-2 ${
                      i === 0 ? "aspect-square" : "aspect-square"
                    }`}
                  >
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

      <section className="border-t border-line bg-surface-1">
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <Reveal>
            <SectionHeading eyebrow={type.visitLabel} title="Come see us" align="center" />
            <div className="mt-8 flex flex-col items-center gap-3 text-ink-muted">
              {settings?.address && (
                <p className="flex items-center gap-2.5">
                  <MapPin className="size-4 shrink-0 text-brand" aria-hidden />
                  {settings.address}
                </p>
              )}
              {hoursLine && (
                <p className="flex items-center gap-2.5">
                  <Clock className="size-4 shrink-0 text-brand" aria-hidden />
                  {hoursLine}
                </p>
              )}
            </div>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <SiteButton href="/contact" size="lg">
                Contact &amp; hours
              </SiteButton>
              {settings?.address && (
                <a
                  href={mapsUrl(settings.address)!}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-13 items-center justify-center gap-2.5 rounded-full border border-brand-line px-7 text-base font-medium tracking-wide text-brand transition-colors duration-300 hover:bg-brand-tint"
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
