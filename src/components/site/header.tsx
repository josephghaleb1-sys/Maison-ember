"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/site/brand-mark";
import { cn } from "@/lib/utils";

export interface NavLink {
  href: string;
  label: string;
}

/**
 * Site header: transparent over the hero, frosted once the page scrolls.
 *
 * The scrolled state comes from an IntersectionObserver on a 1px sentinel
 * rather than a scroll listener, so scrolling stays off the main thread.
 */
export function SiteHeader({
  businessName,
  logoPath,
  links,
  ctaHref,
  ctaLabel,
}: {
  businessName: string;
  logoPath: string | null;
  links: NavLink[];
  ctaHref: string;
  ctaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      <header
        className={cn(
          "sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled
            ? "border-b border-accent/15 bg-ink-950/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 sm:py-5">
          <Link href="/" className="group flex items-center gap-3" aria-label={businessName}>
            <BrandMark name={businessName} logoPath={logoPath} size={40} />
            <span className="font-display text-base font-semibold uppercase tracking-[0.26em] text-ink-50 transition-colors group-hover:text-accent-bright sm:text-lg">
              {businessName}
            </span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative py-1 text-[0.8125rem] font-medium uppercase tracking-[0.18em] transition-colors",
                    active ? "text-accent" : "text-ink-200 hover:text-accent-bright",
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-accent transition-transform duration-300",
                      active ? "scale-x-100" : "scale-x-0",
                    )}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={ctaHref}
              className="hidden rounded-full border border-accent/50 px-5 py-2 text-[0.75rem] font-medium uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent hover:text-on-accent sm:inline-flex"
            >
              {ctaLabel}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="flex size-10 items-center justify-center rounded-full border border-ink-700 text-ink-100 transition-colors hover:border-accent/50 hover:text-accent lg:hidden"
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink-950/95 backdrop-blur-xl transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
      >
        <nav className="flex h-full flex-col justify-center gap-2 px-8 pb-20">
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              data-motion
              style={{ transitionDelay: open ? `${80 + index * 55}ms` : "0ms" }}
              className={cn(
                "border-b border-ink-800/80 py-4 font-display text-3xl font-medium tracking-wide transition-all duration-500",
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                pathname === link.href ? "text-accent" : "text-ink-50",
              )}
              tabIndex={open ? 0 : -1}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={ctaHref}
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-on-accent"
          >
            {ctaLabel}
          </Link>
        </nav>
      </div>
    </>
  );
}
