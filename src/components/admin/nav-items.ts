import {
  LayoutDashboard,
  Tags,
  Images,
  Settings,
  Palette,
  Store,
  UtensilsCrossed,
  Coffee,
  BookOpen,
  ShoppingBag,
  Scissors,
  Dumbbell,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { BusinessTypeConfig } from "@/lib/business-types";

/** Maps the plain icon name carried by BUSINESS_TYPES to a component. The
 * config itself stays data-only so it can cross the server/client boundary;
 * the resolution happens here, where components are already in scope. */
const CATALOG_ICONS: Record<BusinessTypeConfig["icon"], LucideIcon> = {
  utensils: UtensilsCrossed,
  coffee: Coffee,
  book: BookOpen,
  "shopping-bag": ShoppingBag,
  scissors: Scissors,
  dumbbell: Dumbbell,
  sparkles: Sparkles,
};

export function getCatalogIcon(name: BusinessTypeConfig["icon"]): LucideIcon {
  return CATALOG_ICONS[name] ?? ShoppingBag;
}

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
  /** Shown in the mobile bottom bar. Non-primary items live behind "More". */
  primary: boolean;
}

/**
 * The dashboard's navigation, built from the business's industry so a
 * restaurant sees "Menu items" where a bookshop sees "Books & products".
 */
export function buildAdminNav(type: BusinessTypeConfig): AdminNavItem[] {
  return [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, primary: true },
    {
      href: "/admin/products",
      label: type.adminCatalogLabel,
      icon: getCatalogIcon(type.icon),
      exact: false,
      primary: true,
    },
    { href: "/admin/categories", label: "Categories", icon: Tags, exact: false, primary: true },
    { href: "/admin/media", label: "Media", icon: Images, exact: false, primary: true },
    { href: "/admin/website", label: "Website", icon: Palette, exact: false, primary: false },
    { href: "/admin/business", label: "Business info", icon: Store, exact: false, primary: false },
    { href: "/admin/settings", label: "Settings", icon: Settings, exact: false, primary: false },
  ];
}
