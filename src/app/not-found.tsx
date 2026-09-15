import Link from "next/link";
import { getSiteContext } from "@/lib/business";
import { BrandMark } from "@/components/site/brand-mark";

/**
 * 404 for URLs that match no route at all.
 *
 * It sits above the (site) route group, so it renders without the usual
 * header/footer — it therefore carries its own brand chrome, still read from
 * the database rather than hard-coded.
 */
export default async function NotFound() {
  const { businessName, settings, theme, preset } = await getSiteContext();

  return (
    <div
      style={theme.style}
      className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 py-24 text-center"
    >
      <Link href="/" className="flex items-center gap-3">
        <BrandMark name={businessName} logoPath={settings?.logo_path ?? null} size={44} />
        <span className="font-display text-lg font-semibold uppercase tracking-[0.24em] text-ink-50">
          {businessName}
        </span>
      </Link>

      <p className="eyebrow mt-12 text-accent">404</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-ink-50 sm:text-5xl">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-4 max-w-md text-ink-300">
        The link may be old, or the page may have moved.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full bg-accent-solid px-6 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-accent-bright"
        >
          Back home
        </Link>
        <Link
          href={preset.catalogPath}
          className="inline-flex h-11 items-center rounded-full border border-accent/50 px-6 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent-solid hover:text-on-accent"
        >
          {preset.catalogLabel}
        </Link>
      </div>
    </div>
  );
}
