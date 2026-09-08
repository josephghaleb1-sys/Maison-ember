import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import {
  getPublicBusiness,
  getPublicCategories,
  getPublicGalleryMedia,
  getPublicProducts,
  getPublicSettings,
} from "@/lib/business";
import { getPublicMediaUrl } from "@/lib/storage";
import { Hero } from "@/components/site/hero";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [business, settings, categories, products, gallery] = await Promise.all([
    getPublicBusiness(),
    getPublicSettings(),
    getPublicCategories(),
    getPublicProducts(),
    getPublicGalleryMedia(),
  ]);

  const businessName = settings?.business_name || business.name;
  const featuredProducts = products.slice(0, 4);
  const featuredGallery = gallery.slice(0, 4);
  const todayHours = settings?.hours?.mon;

  return (
    <>
      <Hero
        imagePath={settings?.hero_image_path ?? null}
        title={businessName}
        tagline={settings?.tagline || "A menu worth crossing town for."}
      >
        <Link href="/menu">
          <Button size="lg">
            View menu <ArrowRight className="size-4" aria-hidden />
          </Button>
        </Link>
        <Link href="/contact">
          <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
            Visit us
          </Button>
        </Link>
      </Hero>

      {settings?.about_text && (
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-charcoal-900">Our story</h2>
          <p className="mt-4 text-lg leading-relaxed text-charcoal-600">
            {settings.about_text.length > 340
              ? `${settings.about_text.slice(0, 340).trim()}…`
              : settings.about_text}
          </p>
          <Link
            href="/about"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ember-600 hover:underline"
          >
            Read more <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold text-charcoal-900">From the menu</h2>
              <Link href="/menu" className="text-sm font-medium text-ember-600 hover:underline">
                Full menu
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <span
                key={category.id}
                className="rounded-full border border-ember-200 bg-ember-50 px-4 py-1.5 text-sm font-medium text-ember-700"
              >
                {category.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {featuredGallery.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold text-charcoal-900">Inside Maison Ember</h2>
              <Link href="/gallery" className="text-sm font-medium text-ember-600 hover:underline">
                View gallery
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {featuredGallery.map((item) => (
                <div key={item.id} className="relative aspect-square overflow-hidden rounded-xl bg-charcoal-100">
                  <Image
                    src={getPublicMediaUrl(item.storage_path)}
                    alt={item.alt_text || businessName}
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-charcoal-950 py-16 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 text-center sm:px-6">
          {settings?.address && (
            <p className="flex items-center gap-2 text-charcoal-200">
              <MapPin className="size-4" aria-hidden /> {settings.address}
            </p>
          )}
          {todayHours && (
            <p className="flex items-center gap-2 text-charcoal-200">
              <Clock className="size-4" aria-hidden /> Today: {todayHours}
            </p>
          )}
          <Link href="/contact">
            <Button size="lg" className="mt-2">
              Get directions & hours
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
