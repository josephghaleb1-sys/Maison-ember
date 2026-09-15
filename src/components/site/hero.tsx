import Image from "next/image";
import { getPublicMediaUrl } from "@/lib/storage";
import { BrandOrb } from "@/components/site/brand-orb";
import { DustField } from "@/components/site/dust-field";
import { getInitials } from "@/components/site/brand-mark";
import { ScrollScene } from "@/components/site/scroll-scene";
import type { BrandTheme } from "@/lib/theme";

/**
 * The hero.
 *
 * Two modes, both driven by data: if the owner has uploaded a hero image it
 * becomes the backdrop; otherwise the built-in 3D scene (velvet gradient
 * stage + orbiting rings + drifting motes) carries the page, so a brand-new
 * business still looks finished. Either way the copy comes from
 * website_settings.
 *
 * Scrolling drives the scene: <ScrollScene> publishes the hero's own progress
 * as --scroll-progress, and each layer moves at a different rate off it — the
 * backdrop drifts down, the copy lifts and fades, the 3D mark recedes and
 * tilts. Different rates are what read as depth. All of it is transform and
 * opacity, so it runs on the compositor, and it stops entirely once the hero
 * leaves the viewport or the visitor prefers reduced motion.
 */
export function Hero({
  imagePath,
  eyebrow,
  title,
  subtitle,
  businessName,
  theme,
  children,
}: {
  imagePath: string | null;
  eyebrow?: string;
  title: string;
  subtitle: string;
  businessName: string;
  theme: BrandTheme;
  children?: React.ReactNode;
}) {
  const hasPhoto = Boolean(imagePath);

  return (
    <ScrollScene className="relative isolate block min-h-[92svh] overflow-hidden">
    <section className="relative flex min-h-[92svh] items-center">
      {/* ---- Backdrop ---- */}
      {hasPhoto ? (
        <>
          <Image
            src={getPublicMediaUrl(imagePath!)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 scale-110 object-cover will-change-transform"
            style={{
              transform: "translate3d(0, calc(var(--scroll-progress, 0) * 9vh), 0)",
            }}
          />
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(105deg, color-mix(in srgb, var(--ink-950) 92%, transparent) 0%, color-mix(in srgb, var(--ink-950) 70%, transparent) 45%, color-mix(in srgb, var(--ink-950) 40%, transparent) 100%)",
            }}
            aria-hidden
          />
        </>
      ) : (
        <div
          className="absolute inset-0 -z-10 will-change-transform"
          style={{ transform: "translate3d(0, calc(var(--scroll-progress, 0) * 7vh), 0)" }}
          aria-hidden
        >
          {/* Velvet stage: a deep brand-coloured wash with soft folds. Pure
              CSS gradients — no image weight, no layout cost. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 78% 12%, color-mix(in oklab, var(--brand-primary) var(--stage-mix), var(--ink-950)) 0%, var(--ink-950) 62%), radial-gradient(90% 70% at 10% 100%, color-mix(in oklab, var(--brand-primary) var(--stage-mix-soft), var(--ink-950)) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.45] mix-blend-soft-light"
            style={{
              background:
                "repeating-linear-gradient(104deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0) 3px, rgba(0,0,0,0.05) 7px, rgba(255,255,255,0) 12px)",
            }}
          />
        </div>
      )}

      <DustField
        rgb={theme.mode === "light" ? theme.accentTextRgb : theme.secondaryRgb}
        brightRgb={theme.mode === "light" ? theme.primaryRgb : undefined}
        density={hasPhoto ? 22 : 38}
        className="-z-10"
      />

      {/* Vignette keeps the copy readable over either backdrop. */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/35 to-ink-950/60"
        aria-hidden
      />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-20 pt-28 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:pb-28 lg:pt-32">
        <div
          className="max-w-xl will-change-transform"
          style={{
            transform: "translate3d(0, calc(var(--scroll-progress, 0) * -6vh), 0)",
            opacity: "calc(1 - var(--scroll-progress, 0) * 1.1)",
          }}
        >
          {eyebrow && (
            <p className="animate-fade-up eyebrow text-accent">{eyebrow}</p>
          )}
          <h1
            className="animate-fade-up mt-5 font-display text-[clamp(2.75rem,8.5vw,5.25rem)] font-semibold leading-[0.98] tracking-[-0.01em] text-ink-50 text-balance"
            style={{ animationDelay: "90ms" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="animate-fade-up mt-6 max-w-lg text-base leading-relaxed text-ink-200 sm:text-lg"
              style={{ animationDelay: "200ms" }}
            >
              {subtitle}
            </p>
          )}
          {children && (
            <div
              className="animate-fade-up mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "320ms" }}
            >
              {children}
            </div>
          )}
        </div>

        {/* The 3D mark only earns its place when there's no hero photo
            competing with it. */}
        {!hasPhoto && (
          <div
            className="flex justify-center will-change-transform lg:justify-end"
            style={{
              transform:
                "perspective(1200px) translate3d(0, calc(var(--scroll-progress, 0) * 12vh), 0) rotateX(calc(var(--scroll-progress, 0) * 18deg)) scale(calc(1 - var(--scroll-progress, 0) * 0.18))",
              opacity: "calc(1 - var(--scroll-progress, 0) * 0.65)",
            }}
          >
            <BrandOrb monogram={getInitials(businessName)} />
          </div>
        )}
      </div>

      {/* Scroll cue — a slow travelling highlight inside a hairline. */}
      <div
        className="absolute inset-x-0 bottom-8 hidden justify-center sm:flex"
        style={{ opacity: "calc(1 - var(--scroll-progress, 0) * 3)" }}
        aria-hidden
      >
        <span className="flex h-10 w-6 items-start justify-center rounded-full border border-accent/35 p-1.5">
          <span className="animate-bob block size-1.5 rounded-full bg-accent-solid" />
        </span>
      </div>

      <div className="hairline-accent absolute inset-x-0 bottom-0 h-px" aria-hidden />
    </section>
    </ScrollScene>
  );
}
