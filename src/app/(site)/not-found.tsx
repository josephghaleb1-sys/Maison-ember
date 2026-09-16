import Link from "next/link";

/**
 * Shown when a host maps to no business, or a URL doesn't exist on this
 * business's site (e.g. /menu on a bookshop, whose catalog lives at /shop).
 *
 * Deliberately unbranded: if no business resolved, there are no brand colors
 * to render it in.
 */
export default function SiteNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-semibold text-brand">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
        The page you were looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-medium text-on-brand transition-colors hover:bg-brand-strong"
      >
        Back to homepage
      </Link>
    </div>
  );
}
