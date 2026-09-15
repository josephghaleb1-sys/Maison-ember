import Link from "next/link";

/** Branded 404 for the public site, inside the normal header/footer chrome. */
export default function SiteNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="eyebrow text-accent">404</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-ink-50 sm:text-5xl">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-4 text-ink-300">
        The link may be old, or the page may have moved. Everything we sell is a click away.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-accent-bright"
        >
          Back home
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-11 items-center rounded-full border border-accent/50 px-6 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent hover:text-on-accent"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
