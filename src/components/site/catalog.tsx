import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PackageOpen } from "lucide-react";
import {
  getPublicCategories,
  getPublicProducts,
  getSiteContext,
} from "@/lib/business";
import { whatsappHref } from "@/lib/contact";
import type { CatalogPath } from "@/lib/industry";
import { ProductCard, ProductRowCard } from "@/components/site/product-card";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";

/**
 * The catalogue — products, menu items or services, depending on the
 * business's industry. One implementation serves all of them: only the
 * wording (from the industry preset) and the card shape change.
 *
 * It's mounted at /shop, /menu and /services; whichever path the business's
 * industry declares canonical renders, and the other two redirect to it, so
 * every business gets a URL that reads naturally without duplicate content.
 */

export async function catalogMetadata(): Promise<Metadata> {
  const { preset } = await getSiteContext();
  return {
    title: preset.catalogHeading,
    description: preset.catalogIntro,
    alternates: { canonical: preset.catalogPath },
  };
}

export async function CatalogPage({ path }: { path: CatalogPath }) {
  const [{ businessName, settings, preset }, categories, products] = await Promise.all([
    getSiteContext(),
    getPublicCategories(),
    getPublicProducts(),
  ]);

  if (preset.catalogPath !== path) redirect(preset.catalogPath);

  const currency = settings?.currency || "USD";
  const showPrices = settings?.show_prices ?? true;
  const whatsapp = whatsappHref(settings?.whatsapp || settings?.phone);

  const grouped = categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      items: products.filter((product) => product.category_id === category.id),
    }))
    .filter((group) => group.items.length > 0);

  const uncategorized = products.filter((product) => !product.category_id);
  const sections =
    uncategorized.length > 0
      ? [...grouped, { id: "more", name: grouped.length > 0 ? "More" : preset.catalogHeading, items: uncategorized }]
      : grouped;

  return (
    <>
      <Section className="pb-0 pt-32 sm:pt-36">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-accent">{businessName}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-ink-50 text-balance sm:text-5xl">
            {preset.catalogHeading}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-300">{preset.catalogIntro}</p>
        </Reveal>

        {sections.length > 1 && (
          <Reveal delay={120} className="mt-10 flex flex-wrap justify-center gap-2.5">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-ink-700 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-ink-300 transition-colors hover:border-accent/60 hover:text-accent"
              >
                {section.name}
              </a>
            ))}
          </Reveal>
        )}
      </Section>

      {sections.length === 0 ? (
        <Section>
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink-700 px-6 py-20 text-center">
            <PackageOpen className="size-9 text-accent/60" aria-hidden />
            <p className="text-ink-300">
              Our {preset.itemNounPlural} are being updated — please check back soon.
            </p>
          </div>
        </Section>
      ) : (
        <Section className="space-y-20">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-28">
              <Reveal className="flex items-center gap-4">
                <h2 className="font-display text-2xl font-semibold text-ink-50 sm:text-3xl">
                  {section.name}
                </h2>
                <span className="hairline-accent h-px flex-1" aria-hidden />
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                  {section.items.length} {section.items.length === 1 ? preset.itemNoun : preset.itemNounPlural}
                </span>
              </Reveal>

              {preset.layout === "grid" ? (
                // Flex rather than grid so a category with one or two items
                // centres its row instead of hugging the left edge.
                <div className="mt-8 flex flex-wrap justify-center gap-5">
                  {section.items.map((product, index) => (
                    <Reveal
                      key={product.id}
                      delay={(index % 3) * 90}
                      className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)]"
                    >
                      <ProductCard
                        product={product}
                        currency={currency}
                        showPrice={showPrices}
                        orderHref={
                          whatsapp
                            ? `${whatsapp}?text=${encodeURIComponent(
                                `Hi ${businessName}! I'd like to order: ${product.name}`,
                              )}`
                            : null
                        }
                      />
                    </Reveal>
                  ))}
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {section.items.map((product, index) => (
                    <Reveal key={product.id} delay={(index % 2) * 70}>
                      <ProductRowCard
                        product={product}
                        currency={currency}
                        showPrice={showPrices}
                        orderHref={whatsapp}
                      />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}
    </>
  );
}
