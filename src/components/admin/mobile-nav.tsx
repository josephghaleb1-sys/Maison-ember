import type { BusinessTypeConfig } from "@/lib/business-types";
import { buildAdminNav } from "@/components/admin/nav-items";
import { MobileNavLink } from "@/components/admin/nav-link";
import { MobileMoreMenu } from "@/components/admin/mobile-more-menu";

/**
 * Bottom tab bar. Only `primary` destinations get a tab — cramming all seven
 * into a phone-width bar makes every target too small to hit, so the rest
 * live behind "More".
 */
export function MobileNav({ type }: { type: BusinessTypeConfig }) {
  const navItems = buildAdminNav(type);
  const primary = navItems.filter((item) => item.primary);
  const secondary = navItems.filter((item) => !item.primary);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-charcoal-800 bg-charcoal-900/95 backdrop-blur md:hidden">
      {primary.map((item) => (
        <MobileNavLink
          key={item.href}
          href={item.href}
          label={item.label}
          exact={item.exact}
          icon={<item.icon className="size-5" aria-hidden />}
        />
      ))}
      <MobileMoreMenu
        items={secondary.map((item) => ({
          href: item.href,
          label: item.label,
          icon: <item.icon className="size-4.5 shrink-0" aria-hidden />,
        }))}
      />
    </nav>
  );
}
