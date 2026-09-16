"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublicMediaUrl } from "@/lib/storage";

export function SiteHeader({
  businessName,
  logoPath,
  catalogSegment,
  catalogLabel,
}: {
  businessName: string;
  logoPath: string | null;
  /** Industry-driven, e.g. "shop" for a bookshop, "menu" for a restaurant. */
  catalogSegment: string;
  catalogLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: `/${catalogSegment}`, label: catalogLabel },
    { href: "/about", label: "About" },
    { href: "/gallery", label: "Gallery" },
    { href: "/contact", label: "Contact" },
  ];

  // Only the homepage has a full-bleed hero for the header to float over.
  // Everywhere else it stays solid from the start, so nav text never sits on
  // bare page background.
  const overlaysHero = pathname === "/";

  // While floating over the hero, the header sits on the hero scrim, which is
  // dark for EVERY palette (see --hero-scrim). Brand/ink tokens are solved
  // against the page surface, so on a light theme they'd be dark-on-dark
  // here — over the hero the header uses plain white instead.
  const onHero = overlaysHero && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        // Fixed, not sticky: a sticky header stays in normal flow, so it
        // would sit *above* the hero as a solid strip instead of floating
        // over it. Inner pages carry top padding to clear it.
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled || open || !overlaysHero
          ? "border-b border-line bg-surface/95 backdrop-blur"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="group flex min-w-0 items-center gap-3"
        >
          {logoPath ? (
            <span className="relative size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-brand-line">
              <Image
                src={getPublicMediaUrl(logoPath)}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            </span>
          ) : (
            <span
              aria-hidden
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full border font-display text-lg font-semibold",
                onHero
                  ? "border-white/40 text-white"
                  : "border-brand-line text-brand-ink",
              )}
            >
              {businessName.trim().charAt(0).toUpperCase() || "·"}
            </span>
          )}
          <span
            className={cn(
              "truncate font-display text-lg font-semibold tracking-tight",
              onHero ? "text-white" : "text-ink",
            )}
          >
            {businessName}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-1 text-sm font-medium tracking-wide transition-colors",
                  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100",
                  onHero
                    ? "after:bg-white"
                    : "after:bg-brand",
                  active && "after:scale-x-100",
                  onHero
                    ? active
                      ? "text-white"
                      : "text-white/75 hover:text-white"
                    : active
                      ? "text-brand-ink"
                      : "text-ink-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-mobile-nav"
          className={cn(
            "flex size-10 items-center justify-center rounded-lg transition-colors md:hidden",
            onHero ? "text-white hover:bg-white/15" : "text-ink hover:bg-surface-2",
          )}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      {open && (
        <nav id="site-mobile-nav" className="border-t border-line bg-surface px-4 pb-3 md:hidden">
          <ul className="flex flex-col">
            {links.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block border-b border-line/60 py-4 text-base font-medium last:border-b-0",
                      active ? "text-brand-ink" : "text-ink",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
