/**
 * Endless scrolling strip of short phrases. The track holds the list twice
 * and translates by exactly -50%, which loops seamlessly; it animates a
 * transform only, so it runs on the compositor and stops under
 * prefers-reduced-motion (where it degrades to a static, readable row).
 */
export function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div
      className="relative flex overflow-hidden border-y border-accent/15 bg-ink-900/40 py-4"
      role="presentation"
    >
      <div className="animate-marquee flex shrink-0 items-center gap-10 whitespace-nowrap pr-10 motion-reduce:animate-none">
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-10 text-[0.6875rem] font-medium uppercase tracking-[0.32em] text-ink-300"
          >
            {item}
            <span className="size-1 rounded-full bg-accent/70" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
