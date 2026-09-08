"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { navItems } from "@/components/admin/nav-items";

type NavItem = (typeof navItems)[number];

export function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function DesktopNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = isActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-ember-600 text-white"
          : "text-charcoal-300 hover:bg-charcoal-800 hover:text-white",
      )}
    >
      <Icon className="size-4.5 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export function MobileNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = isActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
        active ? "text-ember-600" : "text-charcoal-400",
      )}
    >
      <Icon className="size-5" aria-hidden />
      {item.label}
    </Link>
  );
}
