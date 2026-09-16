"use client";

import { useEffect } from "react";

/**
 * Public-site error boundary. Visitors get a calm, non-technical message;
 * the real cause goes to the server logs via console.error, never onto the
 * page (an error string can leak table names or connection details).
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public site error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Something went wrong on our end
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
        We couldn&apos;t load this page just now. Please try again in a moment.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-ink-faint">Reference: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-medium text-on-brand transition-colors hover:bg-brand-strong"
      >
        Try again
      </button>
    </div>
  );
}
