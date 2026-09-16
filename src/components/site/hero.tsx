import Image from "next/image";
import type { OrnamentMotif } from "@/lib/business-types";
import { getPublicMediaUrl } from "@/lib/storage";
import { Ornament } from "@/components/site/ornament";
import { HeroParallax } from "@/components/site/hero-parallax";
import { cn } from "@/lib/utils";

/**
 * Full-bleed hero, in one of two modes.
 *
 * **With a photograph** — the image runs full bleed under a dark scrim and the
 * headline is white. A scrim is unavoidable here: the business controls the
 * photo, so nothing else can guarantee the text stays readable.
 *
 * **Without one** — the hero stays in the business's own palette: a light
 * beige-gold wash on a light theme, with the headline in ink and an
 * industry-appropriate line-art illustration alongside. Darkening a page this
 * pale just to reuse the photo treatment threw the brand away and made an
 * unconfigured site look like a different, gloomier business.
 *
 * Both modes take every word from the database.
 */
export function Hero({
  imagePath,
  eyebrow,
  title,
  subtitle,
  motif,
  children,
}: {
  imagePath: string | null;
  eyebrow?: string;
  title: string;
  subtitle: string;
  motif: OrnamentMotif;
  children?: React.ReactNode;
}) {
  const hasPhoto = Boolean(imagePath);

  return (
    <section
      className={cn(
        "relative flex min-h-[82vh] overflow-hidden bg-surface",
        hasPhoto ? "items-end" : "items-center",
      )}
    >
      {hasPhoto ? (
        <>
          <HeroParallax>
            <Image
              src={getPublicMediaUrl(imagePath!)}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
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
          {/* The header floats over this hero and the main scrim is weakest at
              the very top — this band keeps that strip dark. */}
          <div
            className="absolute inset-x-0 top-0 h-36"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in oklab, var(--hero-scrim) 70%, transparent), transparent)",
            }}
            aria-hidden
          />
        </>
      ) : (
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          {/* Warm wash: the page surface lifted toward the brand, so the hero
              is a richer shade of the same family rather than a grey box. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, var(--surface) 0%, var(--surface-1) 42%, var(--surface-2) 100%)",
            }}
          />
          <div className="animate-ambient-glow absolute -right-[12%] top-[-18%] size-[70vh] rounded-full bg-brand/15 blur-[120px]" />
          <div
            className="animate-ambient-glow absolute bottom-[-26%] left-[-12%] size-[52vh] rounded-full bg-brand/10 blur-[110px]"
            style={{ animationDelay: "1.5s" }}
          />
          {/* Fine diagonal texture — reads as laid paper at a distance and
              keeps large empty areas from looking flat. */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, var(--brand) 0 1px, transparent 1px 13px)",
            }}
          />
        </div>
      )}

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-36 sm:px-6 sm:pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          {eyebrow && (
            <p
              className={cn(
                "animate-fade-up mb-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em]",
                hasPhoto ? "text-brand" : "text-brand-ink",
              )}
            >
              <span
                className={cn("h-px w-8", hasPhoto ? "bg-brand" : "bg-brand-ink")}
                aria-hidden
              />
              {eyebrow}
            </p>
          )}
          <h1
            className={cn(
              "animate-fade-up font-display text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-6xl lg:text-7xl",
              hasPhoto ? "text-white" : "text-ink",
            )}
            style={{ animationDelay: "80ms" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={cn(
                "animate-fade-up mt-6 max-w-xl text-lg leading-relaxed",
                hasPhoto ? "text-white/80" : "text-ink-muted",
              )}
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

        {/* The illustration only appears in the no-photo mode — over a
            photograph it would be clutter competing with the image. It shows
            on phones too, just smaller: most visitors arrive from a social
            profile on a phone, and the hero is the whole first impression. */}
        {!hasPhoto && (
          <div
            className="animate-fade-up relative order-first lg:order-none"
            style={{ animationDelay: "400ms" }}
          >
            <div
              className="absolute inset-0 -m-10 rounded-full bg-brand/10 blur-3xl"
              aria-hidden
            />
            <Ornament
              motif={motif}
              className="relative mx-auto max-w-[13rem] text-brand sm:max-w-[16rem] lg:max-w-[30rem]"
            />
          </div>
        )}
      </div>
    </section>
  );
}
