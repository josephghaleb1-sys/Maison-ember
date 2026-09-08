import { Flame } from "lucide-react";
import { navItems } from "@/components/admin/nav-items";
import { DesktopNavLink } from "@/components/admin/nav-link";

export function Sidebar({ businessName }: { businessName: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-charcoal-950 md:flex">
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex size-9 items-center justify-center rounded-full bg-ember-600 text-white">
          <Flame className="size-5" aria-hidden />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-white">{businessName}</p>
          <p className="text-xs text-charcoal-400">Dashboard</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => (
          <DesktopNavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
