import { cn } from "@/lib/utils";

/**
 * Shared section header for the public site: small brand eyebrow, serif
 * headline, optional supporting line. Keeping it in one place is what stops
 * each page inventing its own heading scale.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn(centered && "mx-auto max-w-2xl text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-brand",
            centered && "justify-center",
          )}
        >
          <span className="h-px w-8 bg-brand" aria-hidden />
          {eyebrow}
          {centered && <span className="h-px w-8 bg-brand" aria-hidden />}
        </p>
      )}
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink text-balance sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-ink-muted">{description}</p>
      )}
    </div>
  );
}
