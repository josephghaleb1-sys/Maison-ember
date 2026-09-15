import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import {
  getPublicCategories,
  getPublicGalleryMedia,
  getPublicProducts,
  getPublicTestimonials,
  getSiteContext,
} from "@/lib/business";
import { getPublicMediaUrl } from "@/lib/storage";
import { whatsappHref } from "@/lib/contact";
import { Hero } from "@/components/site/hero";
import { Marquee } from "@/components/site/marquee";
import { ProductCard, ProductRowCard } from "@/components/site/product-card";
import { Reveal } from "@/components/site/reveal";
import { Section, SectionHeading } from "@/components/site/section";
import { TestimonialGrid } from "@/components/site/testimonials";
import { Tilt } from "@/components/site/tilt";
import { ButtonLink } from "@/components/ui/button";

export default async function HomePage() {
  const [{ businessName, settings, preset, theme }, categories, products, gallery, testimonials] =
    await Promise.all([
      getSiteContext(),
      getPublicCategories(),
      getPublicProducts(),
      getPublicGalleryMedia(),
      getPublicTestimonials(),
    ]);

  const currency = settings?.currency || "USD";
  const showPrices = settings?.show_prices ?? true;
  const canOrder = settings?.checkout_enabled ?? true;
  const featured = products.slice(0, preset.layout === "grid" ? 4 : 6);
  const featuredGallery = gallery.slice(0, 5);
  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const whatsapp = whatsappHref(settings?.whatsapp || settings?.phone);
  const openDays = Object.entries(settings?.hours ?? {}).filter(
    ([, value]) => value && !/closed/i.test(value),
  );
  const aboutExcerpt = settings?.about_text
    ? settings.about_text.split(/\n+/)[0]
    : "";

  return (
    <>
      <Hero
        imagePath={settings?.hero_image_path ?? null}
        eyebrow={settings?.tagline || undefined}
        title={settings?.hero_title || businessName}
        subtitle={settings?.hero_subtitle || settings?.about_text?.slice(0, 150) || ""}
        businessName={businessName}
        theme={theme}
      >
        <ButtonLink href={preset.catalogPath} size="lg">
          {settings?.hero_cta_label || preset.heroCta}
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
        <ButtonLink href="/contact" size="lg" variant="outline">
          Contact us
        </ButtonLink>
      </Hero>

      <Marquee items={[...preset.highlights, ...categories.slice(0, 4).map((c) => c.name)]} />

      {featured.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="Curated"
            title={preset.featuredHeading}
            link={{ href: preset.catalogPath, label: `All ${preset.itemNounPlural}` }}
          />
          {preset.layout === "grid" ? (
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product, index) => (
                <Reveal key={product.id} delay={index * 90} className="h-full">
                  <ProductCard
                    product={product}
                    currency={currency}
                    showPrice={showPrices}
                    canOrder={canOrder}
                    categoryName={
                      product.category_id ? categoryById.get(product.category_id) : undefined
                    }
                    priority={index < 2}
                    orderHref={
                      whatsapp && `${whatsapp}?text=${encodeURIComponent(
                        `Hi ${businessName}! I'd like to order: ${product.name}`,
                      )}`
                    }
                  />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {featured.map((product, index) => (
                <Reveal key={product.id} delay={index * 70}>
                  <ProductRowCard
                    product={product}
                    currency={currency}
                    showPrice={showPrices}
                    canOrder={canOrder}
                    orderHref={whatsapp}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </Section>
      )}

      {categories.length > 0 && (
        <Section className="pt-0">
          <Reveal className="flex flex-wrap justify-center gap-2.5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`${preset.catalogPath}#${category.id}`}
                className="rounded-full border border-ink-700 px-5 py-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-200 transition-colors duration-300 hover:border-accent/60 hover:text-accent"
              >
                {category.name}
              </Link>
            ))}
          </Reveal>
        </Section>
      )}

      {aboutExcerpt && (
        <Section className="pt-0">
          <div
            className={
              featuredGallery.length > 0
                ? "grid grid-cols-1 items-center gap-12 lg:grid-cols-2"
                : "mx-auto max-w-3xl"
            }
          >
            <div>
              <SectionHeading
                eyebrow="Our story"
                title={`Inside ${businessName}`}
                description={aboutExcerpt}
                link={{ href: "/about", label: "Read more" }}
              />
            </div>
            {featuredGallery.length > 0 && (
              <Reveal delay={120} className="relative">
                {/* Two offset frames — depth without a heavy 3D scene. */}
                <Tilt strength={6} className="relative aspect-[4/3] w-full">
                  <div className="absolute inset-0 overflow-hidden rounded-2xl border border-ink-800">
                    <Image
                      src={getPublicMediaUrl(featuredGallery[0].storage_path)}
                      alt={featuredGallery[0].alt_text || businessName}
                      fill
                      sizes="(min-width: 1024px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                  {featuredGallery[1] && (
                    <div className="absolute -bottom-8 -left-6 hidden aspect-square w-40 overflow-hidden rounded-2xl border border-accent/25 shadow-[0_18px_50px_rgba(0,0,0,0.5)] sm:block">
                      <Image
                        src={getPublicMediaUrl(featuredGallery[1].storage_path)}
                        alt={featuredGallery[1].alt_text || businessName}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </Tilt>
              </Reveal>
            )}
          </div>
        </Section>
      )}

      {testimonials.length > 0 && (
        <Section className="pt-0">
          <SectionHeading eyebrow="Kind words" title="What people say" align="center" />
          <TestimonialGrid testimonials={testimonials} />
        </Section>
      )}

      {featuredGallery.length > 2 && (
        <Section className="pt-0">
          <SectionHeading
            eyebrow="Gallery"
            title={preset.galleryIntro}
            link={{ href: "/gallery", label: "View gallery" }}
          />
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {featuredGallery.slice(0, 4).map((item, index) => (
              <Reveal key={item.id} delay={index * 80}>
                <Tilt strength={8}>
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-ink-800">
                    <Image
                      src={getPublicMediaUrl(item.storage_path)}
                      alt={item.alt_text || businessName}
                      fill
                      sizes="(min-width: 640px) 25vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-out hover:scale-105 motion-reduce:transition-none"
                    />
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* Closing call to action */}
      <Reveal as="section" className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 120% at 50% 0%, color-mix(in oklab, var(--brand-primary) 62%, #08060a) 0%, #08060a 70%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
          <p className="eyebrow text-accent">{preset.contactHeading}</p>
          <h2 className="font-display text-3xl font-semibold text-ink-50 text-balance sm:text-4xl">
            Let&apos;s talk about what you need.
          </h2>
          <div className="mt-2 flex flex-col items-center gap-2 text-sm text-ink-300">
            {settings?.address && (
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-accent/70" aria-hidden /> {settings.address}
              </p>
            )}
            {openDays.length > 0 && (
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-accent/70" aria-hidden /> Open {openDays.length}{" "}
                {openDays.length === 1 ? "day" : "days"} a week
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/contact" size="lg">
              {preset.contactHeading}
            </ButtonLink>
            {whatsapp && (
              <ButtonLink href={whatsapp} size="lg" variant="outline" external>
                WhatsApp
              </ButtonLink>
            )}
          </div>
        </div>
      </Reveal>
    </>
  );
}
