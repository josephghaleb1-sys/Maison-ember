"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Dashboard-level error boundary. Owners get a plain explanation and a retry
 * rather than a blank screen; the digest lets us find the server-side log.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-ink-50">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-ink-400">
        We couldn&apos;t load this page. Your data is safe — nothing was changed. Try again, and if
        it keeps happening check that your database is reachable.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-xs font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-accent-bright"
        >
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </button>
        <Link
          href="/admin"
          className="inline-flex h-10 items-center rounded-full border border-ink-700 px-5 text-xs font-medium uppercase tracking-[0.14em] text-ink-200 transition-colors hover:border-accent/50 hover:text-accent"
        >
          Back to overview
        </Link>
      </div>
      {error.digest && (
        <p className="mt-5 font-mono text-xs text-ink-600">Reference: {error.digest}</p>
      )}
    </div>
  );
}
