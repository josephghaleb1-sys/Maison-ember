import {
  ClipboardList,
  LayoutDashboard,
  ShoppingBag,
  Tags,
  Images,
  Star,
  Palette,
  Settings,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { IndustryPreset } from "@/lib/industry";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}

/**
 * Dashboard navigation. The catalogue entry is named after the business's
 * industry ("Products", "Menu items", "Services"…) so the dashboard speaks
 * the owner's language without any business-specific code.
 */
export function buildNavItems(preset: IndustryPreset): NavItem[] {
  return [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList, exact: false },
    { href: "/admin/products", label: preset.adminLabel, icon: ShoppingBag, exact: false },
    { href: "/admin/categories", label: "Categories", icon: Tags, exact: false },
    { href: "/admin/media", label: "Media", icon: Images, exact: false },
    { href: "/admin/testimonials", label: "Reviews", icon: Star, exact: false },
    { href: "/admin/delivery", label: "Delivery", icon: Truck, exact: false },
    { href: "/admin/website", label: "Website", icon: Palette, exact: false },
    { href: "/admin/settings", label: "Business info", icon: Settings, exact: false },
  ];
}
