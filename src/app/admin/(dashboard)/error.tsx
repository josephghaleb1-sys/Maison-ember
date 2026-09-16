"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Dashboard error boundary. Owners see the actual message here — they're
 * authenticated operators of this business, and a vague "something went
 * wrong" makes real problems (a failed save, a missing table) undebuggable.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="font-display text-xl font-semibold text-cream-50">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-charcoal-400">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-charcoal-600">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex justify-center">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
