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
 * The business's logo, or — until one is uploaded — a monogram badge drawn
 * from the business name. Generic by design: no business-specific artwork
 * lives in the codebase, so a new customer looks finished on day one and
 * branded the moment they upload a logo in the dashboard.
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
          "relative block shrink-0 overflow-hidden rounded-full ring-1 ring-accent/35",
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

  return (
    <span
      className={cn("relative block shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="absolute inset-0 rotate-45 rounded-[22%] border border-accent/60 bg-gradient-to-br from-brand to-brand-deep" />
      <span
        className="absolute inset-0 flex items-center justify-center font-display font-semibold tracking-[0.08em] text-accent-bright"
        style={{ fontSize: size * 0.4 }}
      >
        {getInitials(name)}
      </span>
    </span>
  );
}
