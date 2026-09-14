import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

/** Consistent section rhythm: eyebrow, display heading, optional link. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  link,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  link?: { href: string; label: string };
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-xl", align === "center" && "mx-auto text-center")}>
        {eyebrow && <p className="eyebrow text-accent">{eyebrow}</p>}
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink-50 text-balance sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-4 text-base leading-relaxed text-ink-300">{description}</p>
        )}
      </div>
      {link && (
        <Link
          href={link.href}
          className="group inline-flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-accent transition-colors hover:text-accent-bright"
        >
          {link.label}
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
            aria-hidden
          />
        </Link>
      )}
    </Reveal>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20", className)}>
      {children}
    </section>
  );
}
