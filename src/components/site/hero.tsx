import Image from "next/image";
import { getPublicMediaUrl } from "@/lib/storage";
import { HeroParallax } from "@/components/site/hero-parallax";

/**
 * Full-bleed hero. Every word and color comes from the business's settings,
 * and the no-image fallback is drawn entirely from brand tokens so it looks
 * intentional for any tenant rather than like a missing asset.
 */
export function Hero({
  imagePath,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  imagePath: string | null;
  eyebrow?: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative flex min-h-[78vh] items-end overflow-hidden bg-surface sm:min-h-[88vh]">
      <HeroParallax>
        {imagePath ? (
          <Image
            src={getPublicMediaUrl(imagePath)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: "var(--hero-scrim)" }}
            aria-hidden
          >
            {/* Brand-colored light on a dark ground. Starting from the surface
                color instead meant the scrim flattened everything to neutral
                grey — on a light palette the business's identity disappeared
                entirely. These glows sit above a dark base so the brand hue
                actually survives. */}
            <div className="animate-ambient-glow absolute -right-[10%] top-[-20%] size-[80vh] rounded-full bg-brand/25 blur-[130px]" />
            <div
              className="animate-ambient-glow absolute bottom-[-30%] left-[-10%] size-[60vh] rounded-full bg-brand/20 blur-[110px]"
              style={{ animationDelay: "1.5s" }}
            />
            {/* Fine diagonal texture — reads as embossed paper/linen at a
                distance and keeps large empty areas from looking flat. */}
            <div
              className="absolute inset-0 opacity-[0.10]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, var(--brand) 0 1px, transparent 1px 14px)",
              }}
            />
          </div>
        )}
      </HeroParallax>

      {/* Scrim: guarantees readable headline text over any uploaded photo. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--hero-scrim) 8%, color-mix(in oklab, var(--hero-scrim) 72%, transparent) 46%, color-mix(in oklab, var(--hero-scrim) 30%, transparent) 100%)",
        }}
        aria-hidden
      />

      {/* A second, short gradient under the header. The site header floats
          over this hero in white text, and the main scrim is at its weakest
          exactly there — on a light palette that left white nav links on a
          pale background. This band keeps that strip dark whatever the
          business's colors or hero photo. */}
      <div
        className="absolute inset-x-0 top-0 h-36"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--hero-scrim) 70%, transparent), transparent)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-36 sm:px-6 sm:pb-24">
        {eyebrow && (
          <p className="animate-fade-up mb-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-brand">
            <span className="h-px w-8 bg-brand" aria-hidden />
            {eyebrow}
          </p>
        )}
        <h1
          className="animate-fade-up max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white text-balance sm:text-6xl lg:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-white/80"
            style={{ animationDelay: "200ms" }}
          >
            {subtitle}
          </p>
        )}
        {children && (
          <div
            className="animate-fade-up mt-10 flex flex-wrap gap-3"
            style={{ animationDelay: "320ms" }}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
