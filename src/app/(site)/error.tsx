"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

/**
 * Something failed while rendering a public page — most often the database
 * being unreachable. Visitors get a calm, on-brand page with a retry and a way
 * to reach the business, never a stack trace.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is what ties this to the server log entry.
    console.error("Public site error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="eyebrow text-accent">Something went wrong</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-ink-50">
        We couldn&apos;t load this page
      </h1>
      <p className="mt-4 text-ink-300">
        This is on us, not you. Try again in a moment — or message us and we&apos;ll help you
        straight away.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-accent-solid px-6 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-accent-bright"
        >
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </button>
        <Link
          href="/contact"
          className="inline-flex h-11 items-center rounded-full border border-accent/50 px-6 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent-solid hover:text-on-accent"
        >
          Contact us
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-xs text-ink-600">Reference: {error.digest}</p>
      )}
    </div>
  );
}
