import { BrandMark } from "@/components/site/brand-mark";
import type { NavItem } from "@/components/admin/nav-items";
import { DesktopNavLink } from "@/components/admin/nav-link";

export function Sidebar({
  businessName,
  logoPath,
  items,
}: {
  businessName: string;
  logoPath: string | null;
  items: NavItem[];
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-800 bg-ink-950 md:flex">
      <div className="flex items-center gap-3 px-5 py-6">
        <BrandMark name={businessName} logoPath={logoPath} size={36} />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-ink-50">{businessName}</p>
          <p className="text-xs text-ink-500">Dashboard</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 pb-6">
        {items.map((item) => (
          <DesktopNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            exact={item.exact}
            icon={<item.icon className="size-4.5 shrink-0" aria-hidden />}
          />
        ))}
      </nav>
    </aside>
  );
}
