"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// NOTE: `icon` is passed as an already-rendered ReactNode (JSX), not a raw
// component reference — Server Components may only pass plain data or
// pre-rendered elements to Client Components, never a bare function/component.
interface NavLinkProps {
  href: string;
  label: string;
  exact?: boolean;
  icon: ReactNode;
}

export function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function DesktopNavLink({ href, label, exact, icon }: NavLinkProps) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-ember-600 text-white"
          : "text-charcoal-300 hover:bg-charcoal-800 hover:text-white",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

export function MobileNavLink({ href, label, exact, icon }: NavLinkProps) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
        active ? "text-ember-600" : "text-charcoal-400",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
