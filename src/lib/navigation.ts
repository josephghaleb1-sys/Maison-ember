import type { NavLink } from "@/components/site/header";

/**
 * Public navigation, named after the business's industry: the catalogue entry
 * reads "Shop", "Menu" or "Services" and points at the matching route.
 */
export function buildNavLinks(catalogPath: string, catalogLabel: string): NavLink[] {
  return [
    { href: "/", label: "Home" },
    { href: catalogPath, label: catalogLabel },
    { href: "/about", label: "About" },
    { href: "/gallery", label: "Gallery" },
    { href: "/contact", label: "Contact" },
  ];
}
