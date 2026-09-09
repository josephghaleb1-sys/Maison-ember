import type { Metadata } from "next";
import { UtensilsCrossed } from "lucide-react";
import { getPublicCategories, getPublicProducts } from "@/lib/business";
import { ProductCard } from "@/components/site/product-card";

export const metadata: Metadata = { title: "Menu" };

export default async function MenuPage() {
  const [categories, products] = await Promise.all([getPublicCategories(), getPublicProducts()]);

  const grouped = categories
    .map((category) => ({
      category,
      items: products.filter((p) => p.category_id === category.id),
    }))
    .filter((group) => group.items.length > 0);

  const uncategorized = products.filter((p) => !p.category_id);

  const sections = uncategorized.length > 0
    ? [...grouped, { category: { id: "uncategorized", name: "More" }, items: uncategorized }]
    : grouped;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold text-cream-50">Menu</h1>
        <p className="mt-2 text-charcoal-400">Everything cooked over live fire.</p>
      </div>

      {sections.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center text-charcoal-500">
          <UtensilsCrossed className="size-10" aria-hidden />
          <p>The menu is being freshened up — check back soon.</p>
        </div>
      ) : (
        <div className="mt-14 space-y-14">
          {sections.map(({ category, items }) => (
            <section key={category.id}>
              <h2 className="font-display text-2xl font-semibold text-cream-50">{category.name}</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
