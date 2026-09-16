"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";

/**
 * Sticky save bar shared by the admin's long settings forms. Sits above the
 * mobile tab bar (bottom-16) so it never covers the navigation on a phone.
 */
export function FormFooter({
  isPending,
  error,
  message,
  label = "Save changes",
}: {
  isPending: boolean;
  error?: string;
  message?: string;
  label?: string;
}) {
  return (
    <>
      <FieldError>{error}</FieldError>
      <div
        className="sticky bottom-16 flex flex-wrap items-center gap-3 rounded-xl border border-charcoal-800 bg-charcoal-900/95 p-4 backdrop-blur md:bottom-0"
        role="status"
        aria-live="polite"
      >
        <Button type="submit" loading={isPending}>
          {label}
        </Button>
        {message && <p className="text-sm text-green-500">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </>
  );
}
