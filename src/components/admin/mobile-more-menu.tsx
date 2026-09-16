"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoreItem {
  href: string;
  label: string;
  icon: ReactNode;
}

/** "More" tab for the mobile bottom bar: opens a sheet with the destinations
 * that don't fit as tabs (Website, Business info, Settings). */
export function MobileMoreMenu({ items }: { items: MoreItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // A sheet that stays open behind a navigation, or scrolls the page under
  // itself, feels broken on a phone.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = items.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
          active ? "text-ember-400" : "text-charcoal-500",
        )}
      >
        <MoreHorizontal className="size-5" aria-hidden />
        More
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div
            role="menu"
            aria-label="More destinations"
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-charcoal-800 bg-charcoal-900 pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-sm font-semibold text-cream-50">More</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex size-9 items-center justify-center rounded-lg text-charcoal-300 hover:bg-charcoal-800"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <ul className="px-3 pb-4">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium",
                      pathname.startsWith(item.href)
                        ? "bg-ember-600 text-white"
                        : "text-charcoal-200 hover:bg-charcoal-800",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
