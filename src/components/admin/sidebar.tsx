import type { BusinessTypeConfig } from "@/lib/business-types";
import { buildAdminNav } from "@/components/admin/nav-items";
import { DesktopNavLink } from "@/components/admin/nav-link";

export function Sidebar({
  businessName,
  type,
}: {
  businessName: string;
  type: BusinessTypeConfig;
}) {
  const navItems = buildAdminNav(type);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-charcoal-800 bg-charcoal-950 md:flex">
      <div className="flex items-center gap-3 px-5 py-6">
        {/* Monogram rather than a fixed logo: the dashboard is the platform's
            UI, but it should still tell the operator whose business they're
            editing. */}
        <div
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ember-600 font-display text-base font-semibold text-white"
        >
          {businessName.trim().charAt(0).toUpperCase() || "·"}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-white">{businessName}</p>
          <p className="truncate text-xs text-charcoal-400">{type.label}</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 pb-6">
        {navItems.map((item) => (
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
