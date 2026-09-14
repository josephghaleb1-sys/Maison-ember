import type { Industry } from "@/lib/database.types";

/**
 * Per-industry vocabulary for the public site and the dashboard.
 *
 * This is the mechanism that lets one codebase serve a restaurant, a beauty
 * brand, a barbershop and a gym without business-specific components: the
 * *words* change, the components don't. Business content itself (products,
 * copy, images, colours) always comes from the database — never from here.
 */
export interface IndustryPreset {
  /** Public route the catalogue lives at. Aliases redirect to it. */
  catalogPath: "/shop" | "/menu" | "/services";
  /** Nav label for the catalogue. */
  catalogLabel: string;
  /** Page heading + intro used when the owner hasn't written their own. */
  catalogHeading: string;
  catalogIntro: string;
  /** Singular/plural noun for one catalogue entry. */
  itemNoun: string;
  itemNounPlural: string;
  /** Dashboard nav label for the catalogue section. */
  adminLabel: string;
  /** Primary hero CTA label. */
  heroCta: string;
  /** Home-page section heading above the featured items. */
  featuredHeading: string;
  /** Gallery section intro. */
  galleryIntro: string;
  /** Contact page heading. */
  contactHeading: string;
  /** Short reassurance strip under the hero (3 items). */
  highlights: [string, string, string];
  /** How catalogue entries read best: photo-led cards, or a compact list. */
  layout: "grid" | "list";
}

const PRESETS: Record<Industry, IndustryPreset> = {
  restaurant: {
    catalogPath: "/menu",
    catalogLabel: "Menu",
    catalogHeading: "Menu",
    catalogIntro: "Everything we cook, today.",
    itemNoun: "dish",
    itemNounPlural: "dishes",
    adminLabel: "Menu items",
    heroCta: "View menu",
    featuredHeading: "From the menu",
    galleryIntro: "A look inside the dining room and kitchen.",
    contactHeading: "Visit us",
    highlights: ["Fresh daily", "Table service", "Private events"],
    layout: "list",
  },
  cafe: {
    catalogPath: "/menu",
    catalogLabel: "Menu",
    catalogHeading: "Menu",
    catalogIntro: "Coffee, pastries and everything in between.",
    itemNoun: "item",
    itemNounPlural: "items",
    adminLabel: "Menu items",
    heroCta: "See the menu",
    featuredHeading: "Today's favourites",
    galleryIntro: "The room, the roast, the regulars.",
    contactHeading: "Find us",
    highlights: ["Speciality roasts", "Fresh bakes", "Free Wi-Fi"],
    layout: "list",
  },
  beauty: {
    catalogPath: "/shop",
    catalogLabel: "Shop",
    catalogHeading: "The Collection",
    catalogIntro: "Premium tools and skincare, made for everyday ritual.",
    itemNoun: "product",
    itemNounPlural: "products",
    adminLabel: "Products",
    heroCta: "Shop the collection",
    featuredHeading: "Signature pieces",
    galleryIntro: "Our world, in detail.",
    contactHeading: "Get in touch",
    highlights: ["Cash on delivery", "Premium quality", "Order via DM"],
    layout: "grid",
  },
  barbershop: {
    catalogPath: "/services",
    catalogLabel: "Services",
    catalogHeading: "Services",
    catalogIntro: "Cuts, shaves and grooming.",
    itemNoun: "service",
    itemNounPlural: "services",
    adminLabel: "Services",
    heroCta: "Book a chair",
    featuredHeading: "Most booked",
    galleryIntro: "Recent work from the chair.",
    contactHeading: "Visit the shop",
    highlights: ["Walk-ins welcome", "Master barbers", "Open late"],
    layout: "list",
  },
  salon: {
    catalogPath: "/services",
    catalogLabel: "Services",
    catalogHeading: "Services",
    catalogIntro: "Hair, nails and skin, by appointment.",
    itemNoun: "service",
    itemNounPlural: "services",
    adminLabel: "Services",
    heroCta: "Book an appointment",
    featuredHeading: "Client favourites",
    galleryIntro: "Recent transformations.",
    contactHeading: "Book with us",
    highlights: ["By appointment", "Certified stylists", "Premium products"],
    layout: "list",
  },
  gym: {
    catalogPath: "/services",
    catalogLabel: "Memberships",
    catalogHeading: "Memberships & classes",
    catalogIntro: "Train your way — drop in or go all in.",
    itemNoun: "plan",
    itemNounPlural: "plans",
    adminLabel: "Plans & classes",
    heroCta: "See memberships",
    featuredHeading: "Popular plans",
    galleryIntro: "Inside the floor.",
    contactHeading: "Come train",
    highlights: ["Open 7 days", "Certified coaches", "No lock-in"],
    layout: "grid",
  },
  retail: {
    catalogPath: "/shop",
    catalogLabel: "Shop",
    catalogHeading: "Shop",
    catalogIntro: "This season's pieces.",
    itemNoun: "product",
    itemNounPlural: "products",
    adminLabel: "Products",
    heroCta: "Shop now",
    featuredHeading: "New arrivals",
    galleryIntro: "Styled and shot in store.",
    contactHeading: "Visit the store",
    highlights: ["Fast delivery", "Easy exchanges", "In-store pickup"],
    layout: "grid",
  },
  other: {
    catalogPath: "/shop",
    catalogLabel: "What we offer",
    catalogHeading: "What we offer",
    catalogIntro: "Everything we do, in one place.",
    itemNoun: "item",
    itemNounPlural: "items",
    adminLabel: "Items",
    heroCta: "See what we offer",
    featuredHeading: "Highlights",
    galleryIntro: "A look at our work.",
    contactHeading: "Get in touch",
    highlights: ["Trusted locally", "Quality first", "Talk to a human"],
    layout: "grid",
  },
};

export function getIndustryPreset(industry: Industry | string | null | undefined): IndustryPreset {
  return PRESETS[(industry ?? "other") as Industry] ?? PRESETS.other;
}

export const INDUSTRY_OPTIONS: { value: Industry; label: string }[] = [
  { value: "beauty", label: "Beauty & cosmetics" },
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café" },
  { value: "barbershop", label: "Barbershop" },
  { value: "salon", label: "Salon & spa" },
  { value: "gym", label: "Gym & fitness" },
  { value: "retail", label: "Retail & clothing" },
  { value: "other", label: "Other" },
];

/** Every route the catalogue is reachable at; non-canonical ones redirect. */
export const CATALOG_PATHS = ["/shop", "/menu", "/services"] as const;
export type CatalogPath = (typeof CATALOG_PATHS)[number];
