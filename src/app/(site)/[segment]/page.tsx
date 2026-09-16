import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCategories, getPublicProducts, getSiteContext } from "@/lib/business";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";

/**
 * The catalog page, as a dynamic segment.
 *
 * A restaurant's catalog lives at /menu, a bookshop's at /shop, a salon's at
 * /services — all from this one file. The segment is validated against the
 * served business's industry, so /menu 404s on a bookshop's domain instead of
 * quietly rendering the same page under two URLs (which would split SEO).
 */

type Params = { params: Promise<{ segment: string }> };

async function resolveCatalog(segment: string) {
  const context = await getSiteContext();
  if (segment !== context.type.catalogSegment) notFound();
  return context;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { segment } = await params;
  const { type, businessName } = await resolveCatalog(segment);

  return {
    title: type.catalogLabel,
    description: `Browse ${type.itemPlural} from ${businessName}.`,
    alternates: { canonical: `/${type.catalogSegment}` },
  };
}

export default async function CatalogPage({ params }: Params) {
  const { segment } = await params;
  const { business, type } = await resolveCatalog(segment);

  const [categories, products] = await Promise.all([
    getPublicCategories(),
    getPublicProducts(),
  ]);

  const grouped = categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      items: products.filter((p) => p.category_id === category.id),
    }))
    .filter((group) => group.items.length > 0);

  // Items whose category was deleted (FK is ON DELETE SET NULL) or hidden
  // still belong on the page — they're visible items, so losing them here
  // would silently hide an owner's stock.
  const visibleCategoryIds = new Set(categories.map((c) => c.id));
  const ungrouped = products.filter(
    (p) => !p.category_id || !visibleCategoryIds.has(p.category_id),
  );

  const sections =
    ungrouped.length > 0
      ? [...grouped, { id: "more", name: "More", items: ungrouped }]
      : grouped;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-32 sm:px-6 sm:pb-24 sm:pt-36">
      <Reveal>
        <SectionHeading
          eyebrow={business.name}
          title={type.catalogLabel}
          description={type.defaultCatalogIntro || undefined}
          align="center"
        />
      </Reveal>

      {sections.length === 0 ? (
        <Reveal delay={100}>
          <div className="mx-auto mt-20 max-w-md rounded-2xl border border-line bg-surface-1 px-6 py-14 text-center">
            <p className="font-display text-xl font-semibold text-ink">
              Nothing here just yet
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Our {type.itemPlural} are being updated — please check back shortly.
            </p>
          </div>
        </Reveal>
      ) : (
        <div className="mt-16 space-y-20">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <Reveal>
                <div className="flex items-center gap-5">
                  <h2 className="shrink-0 font-display text-2xl font-semibold tracking-tight text-ink">
                    {section.name}
                  </h2>
                  <span className="rule-fade h-px flex-1" aria-hidden />
                  <span className="shrink-0 text-xs uppercase tracking-[0.2em] text-ink-faint">
                    {section.items.length}{" "}
                    {section.items.length === 1 ? type.itemSingular : type.itemPlural}
                  </span>
                </div>
              </Reveal>

              <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {section.items.map((product, i) => (
                  <Reveal key={product.id} delay={(i % 4) * 80} className="h-full">
                    <ProductCard product={product} currency={business.currency} />
                  </Reveal>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
