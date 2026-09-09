import { navItems } from "@/components/admin/nav-items";
import { MobileNavLink } from "@/components/admin/nav-link";

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-charcoal-800 bg-charcoal-900/95 backdrop-blur md:hidden">
      {navItems.map((item) => (
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
