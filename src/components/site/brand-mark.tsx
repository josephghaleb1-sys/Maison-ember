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
  // Engraved detail only survives above a certain size; in a 40px header the
  // rule and the diamond just turn to mush, so the small version is the
  // cartouche and the initials alone.
  const detailed = size >= 56;

  return (
    <span
      className={cn("relative block shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* A cartouche — the tall, soft-cornered seal stamped on cosmetics and
          perfume packaging. Taller than it is wide, so it reads as a mark
          rather than a button, and drawn in hairlines so it sits quietly next
          to the wordmark instead of competing with product photography. */}
      <svg viewBox="0 0 34 44" className="size-full" role="presentation">
        <defs>
          <linearGradient id="brand-mark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="color-mix(in oklab, var(--brand-primary) 22%, transparent)"
            />
            <stop
              offset="100%"
              stopColor="color-mix(in oklab, var(--brand-primary) 7%, transparent)"
            />
          </linearGradient>
        </defs>

        {/* Outer seal: rounded top and bottom, straight sides. */}
        <path
          d="M17 1.2c6.4 0 11.4 3.6 11.4 8.3v24.2c0 4.7-5 8.3-11.4 8.3S5.6 38.4 5.6 33.7V9.5C5.6 4.8 10.6 1.2 17 1.2z"
          fill="url(#brand-mark-fill)"
          stroke="var(--brand-accent-display, currentColor)"
          strokeWidth="0.9"
        />
        {/* Inner rule, the engraved second line. */}
        {detailed && (
          <path
            d="M17 3.6c5.2 0 9.2 2.9 9.2 6.6v23.6c0 3.7-4 6.6-9.2 6.6s-9.2-2.9-9.2-6.6V10.2C7.8 6.5 11.8 3.6 17 3.6z"
            fill="none"
            stroke="var(--brand-accent-display, currentColor)"
            strokeWidth="0.4"
            opacity="0.55"
          />
        )}

        <text
          x="17"
          y={detailed ? 21.5 : 23}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--brand-accent-display, currentColor)"
          style={{
            fontFamily: "var(--font-display-family), Georgia, serif",
            fontSize: initials.length > 1 ? (detailed ? "12.5px" : "14px") : "17px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            transform: "translateX(0.6px)",
          }}
        >
          {initials}
        </text>

        {/* A short rule and a diamond point below the initials — the small
            flourish that makes a monogram look set rather than typed. */}
        {detailed && (
          <>
            <path
              d="M12.4 27.4h9.2"
              stroke="var(--brand-accent-display, currentColor)"
              strokeWidth="0.55"
              strokeLinecap="round"
              opacity="0.8"
            />
            <g transform="translate(17 31.6) rotate(45)">
              <rect
                x="-1.5"
                y="-1.5"
                width="3"
                height="3"
                rx="0.6"
                fill="var(--brand-accent-display, currentColor)"
                opacity="0.9"
              />
            </g>
          </>
        )}
      </svg>
    </span>
  );
}
