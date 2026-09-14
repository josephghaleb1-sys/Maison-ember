import type { NavItem } from "@/components/admin/nav-items";
import { MobileNavLink } from "@/components/admin/nav-link";

/**
 * Bottom tab bar on phones. Only the five most-used destinations fit
 * comfortably; the rest stay reachable from the Overview page's quick
 * actions.
 */
export function MobileNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-800 bg-ink-900/95 backdrop-blur md:hidden">
      {items.slice(0, 5).map((item) => (
        <MobileNavLink
          key={item.href}
          href={item.href}
          label={item.label}
          exact={item.exact}
          icon={<item.icon className="size-5" aria-hidden />}
        />
      ))}
    </nav>
  );
}
