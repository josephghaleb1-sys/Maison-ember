import { LayoutDashboard, UtensilsCrossed, Tags, Images, Settings } from "lucide-react";

export const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: UtensilsCrossed, exact: false },
  { href: "/admin/categories", label: "Categories", icon: Tags, exact: false },
  { href: "/admin/media", label: "Media", icon: Images, exact: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;
