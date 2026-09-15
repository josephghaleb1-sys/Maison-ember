import Image from "next/image";
import { getPublicMediaUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

/** Up to two initials from a business name, e.g. "Veloura Lab" -> "VL". */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "•";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * The business's logo, or — until one is uploaded — a monogram drawn from the
 * business name.
 *
 * The fallback is deliberately quiet: a hairline ring, a small petal/diamond
 * finial and letterspaced serif initials in the brand's own colours. A heavy
 * filled badge competes with product photography and reads as a placeholder;
 * a fine engraved mark reads as a brand and sits happily on ivory or charcoal.
 * Nothing here is specific to one customer — every business on the platform
 * gets the same treatment in its own palette until it uploads real artwork.
 */
export function BrandMark({
  name,
  logoPath,
  size = 40,
  className,
}: {
  name: string;
  logoPath: string | null | undefined;
  size?: number;
  className?: string;
}) {
  if (logoPath) {
    return (
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-full ring-1 ring-accent/30",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src={getPublicMediaUrl(logoPath)}
          alt={`${name} logo`}
          fill
          sizes={`${size}px`}
          className="object-cover"
          priority
        />
      </span>
    );
  }

  const initials = getInitials(name);

  return (
    <span
      className={cn("relative block shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" className="size-full" role="presentation">
        {/* Outer hairline ring, and a second one inside it — the engraved,
            stamped-foil look you see on cosmetics packaging. */}
        <circle
          cx="24"
          cy="24"
          r="22.2"
          fill="none"
          stroke="var(--brand-accent-display, currentColor)"
          strokeWidth="0.9"
          opacity="0.75"
        />
        <circle
          cx="24"
          cy="24"
          r="19.4"
          fill="color-mix(in oklab, var(--brand-primary) 16%, transparent)"
          stroke="var(--brand-accent-display, currentColor)"
          strokeWidth="0.45"
          opacity="0.5"
        />

        {/* Petal finial at the crown — a small botanical nod, rotated 45°
            so it reads as a diamond at a glance. */}
        <g transform="translate(24 5.4) rotate(45)">
          <rect
            x="-2.1"
            y="-2.1"
            width="4.2"
            height="4.2"
            rx="1"
            fill="var(--brand-accent-display, currentColor)"
          />
        </g>

        <text
          x="24"
          y="24"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--brand-accent-display, currentColor)"
          style={{
            fontFamily: "var(--font-display-family), Georgia, serif",
            fontSize: initials.length > 1 ? "15px" : "19px",
            fontWeight: 500,
            letterSpacing: "0.12em",
            // The letterspacing pushes the glyphs right; nudge them back.
            transform: "translateX(0.9px)",
          }}
        >
          {initials}
        </text>

        {/* Two small rules either side of the base, like a wordmark's rule. */}
        <path
          d="M15 40.2h6M27 40.2h6"
          stroke="var(--brand-accent-display, currentColor)"
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
    </span>
  );
}
