import { cn } from "@/lib/utils";

/**
 * Slow horizontal ticker of short labels — a band of gentle motion between
 * two static sections.
 *
 * The list is rendered twice and the track slides exactly half its width, so
 * the loop is seamless. The duplicate is aria-hidden: it's the same words
 * again and a screen reader shouldn't read them twice. Animation is disabled
 * under prefers-reduced-motion (see .animate-marquee in globals.css), where it
 * degrades to a plain static row.
 */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;

  const row = (duplicate: boolean) => (
    <ul
      className="flex shrink-0 items-center gap-10 pr-10 sm:gap-14 sm:pr-14"
      aria-hidden={duplicate || undefined}
    >
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="flex shrink-0 items-center gap-10 sm:gap-14">
          <span className="whitespace-nowrap font-display text-lg tracking-wide text-ink-muted sm:text-xl">
            {item}
          </span>
          <svg viewBox="0 0 24 24" className="size-2.5 shrink-0 text-brand" fill="currentColor" aria-hidden>
            <path d="M12 2 L20 12 L12 22 L4 12 Z" />
          </svg>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={cn(
        "relative flex overflow-hidden border-y border-line bg-surface-1 py-5",
        className,
      )}
    >
      <div className="animate-marquee flex min-w-max">
        {row(false)}
        {row(true)}
      </div>
      {/* Fade the band into the page at both edges instead of cutting words. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28"
        style={{ background: "linear-gradient(to right, var(--surface-1), transparent)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28"
        style={{ background: "linear-gradient(to left, var(--surface-1), transparent)" }}
        aria-hidden
      />
    </div>
  );
}
