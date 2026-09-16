import type { BusinessType } from "@/lib/database.types";

export type OrnamentMotif =
  | "books"
  | "dining"
  | "cup"
  | "shears"
  | "bloom"
  | "barbell"
  | "bag";

/**
 * Per-industry vocabulary and routing for the public site.
 *
 * This is the file that makes one codebase serve a restaurant, a bookshop and
 * a barbershop without forking it. Nothing here is specific to any single
 * customer — it describes an *industry*, and the business's own data (name,
 * copy, colors, products) still comes from the database.
 *
 * Deliberately plain data: no React components and no icon imports. Icons
 * imported here would be pulled into every Server Component that reads this
 * config and then handed across the server/client boundary, which is not
 * serializable. Client components map `icon` names to components themselves.
 */
export interface BusinessTypeConfig {
  /** Human label for the industry, shown in the dashboard's settings page. */
  label: string;
  /** URL segment for the catalog page, e.g. "menu" -> /menu, "shop" -> /shop. */
  catalogSegment: string;
  /** Nav/page title for the catalog, e.g. "Menu", "Shop", "Services". */
  catalogLabel: string;
  /** Plural noun for catalog items, e.g. "products", "dishes", "services". */
  itemPlural: string;
  /** Singular noun for one catalog item, e.g. "product", "dish", "service". */
  itemSingular: string;
  /** Sidebar label for the catalog section of the dashboard. */
  adminCatalogLabel: string;
  /** lucide-react icon name, resolved to a component inside client code. */
  icon: "utensils" | "coffee" | "book" | "shopping-bag" | "scissors" | "dumbbell" | "sparkles";
  /** Line-art illustration used as the homepage centrepiece. Keeping this
   * per-industry is what lets the same layout feel made-for-them: a bookshop
   * gets a stack of books where a salon gets a bloom. */
  motif: OrnamentMotif;
  /** Default hero call-to-action when the owner hasn't written their own. */
  ctaLabel: string;
  /** Fallback copy used only until the owner fills the field in. */
  defaultTagline: string;
  defaultCatalogIntro: string;
  /** Whether the contact page frames the business as somewhere you visit. */
  visitLabel: string;
}

export const BUSINESS_TYPES: Record<BusinessType, BusinessTypeConfig> = {
  restaurant: {
    label: "Restaurant",
    catalogSegment: "menu",
    catalogLabel: "Menu",
    itemPlural: "dishes",
    itemSingular: "dish",
    adminCatalogLabel: "Menu items",
    icon: "utensils",
    motif: "dining",
    ctaLabel: "View menu",
    defaultTagline: "A menu worth crossing town for.",
    defaultCatalogIntro: "Made fresh, served daily.",
    visitLabel: "Visit us",
  },
  cafe: {
    label: "Café",
    catalogSegment: "menu",
    catalogLabel: "Menu",
    itemPlural: "drinks & plates",
    itemSingular: "item",
    adminCatalogLabel: "Menu items",
    icon: "coffee",
    motif: "cup",
    ctaLabel: "See the menu",
    defaultTagline: "Good coffee, slow mornings.",
    defaultCatalogIntro: "Roasted, poured and baked in house.",
    visitLabel: "Visit us",
  },
  bakery: {
    label: "Bakery",
    catalogSegment: "menu",
    catalogLabel: "Bakery",
    itemPlural: "bakes",
    itemSingular: "bake",
    adminCatalogLabel: "Bakery items",
    icon: "coffee",
    motif: "cup",
    ctaLabel: "See what's baking",
    defaultTagline: "Baked before sunrise, every day.",
    defaultCatalogIntro: "Out of the oven this morning.",
    visitLabel: "Visit us",
  },
  bookshop: {
    label: "Bookshop",
    catalogSegment: "shop",
    catalogLabel: "Shop",
    itemPlural: "titles",
    itemSingular: "title",
    adminCatalogLabel: "Books & products",
    icon: "book",
    motif: "books",
    ctaLabel: "Browse the shelves",
    defaultTagline: "Books worth keeping.",
    defaultCatalogIntro: "A considered selection, shelf by shelf.",
    visitLabel: "Find us",
  },
  retail: {
    label: "Retail store",
    catalogSegment: "shop",
    catalogLabel: "Shop",
    itemPlural: "products",
    itemSingular: "product",
    adminCatalogLabel: "Products",
    icon: "shopping-bag",
    motif: "bag",
    ctaLabel: "Shop the collection",
    defaultTagline: "Chosen with care.",
    defaultCatalogIntro: "Our current collection.",
    visitLabel: "Find us",
  },
  barbershop: {
    label: "Barbershop",
    catalogSegment: "services",
    catalogLabel: "Services",
    itemPlural: "services",
    itemSingular: "service",
    adminCatalogLabel: "Services",
    icon: "scissors",
    motif: "shears",
    ctaLabel: "See services",
    defaultTagline: "A proper cut, every time.",
    defaultCatalogIntro: "What we do, and what it costs.",
    visitLabel: "Book a chair",
  },
  salon: {
    label: "Salon",
    catalogSegment: "services",
    catalogLabel: "Services",
    itemPlural: "treatments",
    itemSingular: "treatment",
    adminCatalogLabel: "Treatments",
    icon: "sparkles",
    motif: "bloom",
    ctaLabel: "See treatments",
    defaultTagline: "Looked after, head to toe.",
    defaultCatalogIntro: "Our treatments and pricing.",
    visitLabel: "Book an appointment",
  },
  gym: {
    label: "Gym / Studio",
    catalogSegment: "classes",
    catalogLabel: "Classes",
    itemPlural: "classes",
    itemSingular: "class",
    adminCatalogLabel: "Classes & plans",
    icon: "dumbbell",
    motif: "barbell",
    ctaLabel: "See classes",
    defaultTagline: "Train properly.",
    defaultCatalogIntro: "Classes, memberships and what they include.",
    visitLabel: "Come train",
  },
  general: {
    label: "General business",
    catalogSegment: "shop",
    catalogLabel: "Offerings",
    itemPlural: "offerings",
    itemSingular: "offering",
    adminCatalogLabel: "Offerings",
    icon: "shopping-bag",
    motif: "bag",
    ctaLabel: "See what we offer",
    defaultTagline: "",
    defaultCatalogIntro: "",
    visitLabel: "Contact us",
  },
};

/** Never throws on unexpected data — falls back to the neutral config. */
export function getBusinessTypeConfig(type: string | null | undefined): BusinessTypeConfig {
  return BUSINESS_TYPES[type as BusinessType] ?? BUSINESS_TYPES.general;
}

/** Every catalog segment any industry can use. The public catalog route is a
 * dynamic segment, and it only renders for the segment belonging to the
 * business being served — this list is what the nav and revalidation paths
 * are drawn from. */
export const ALL_CATALOG_SEGMENTS = Array.from(
  new Set(Object.values(BUSINESS_TYPES).map((c) => c.catalogSegment)),
);

export const BUSINESS_TYPE_OPTIONS = (
  Object.entries(BUSINESS_TYPES) as [BusinessType, BusinessTypeConfig][]
).map(([value, config]) => ({ value, label: config.label }));
