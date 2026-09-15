import type { CSSProperties } from "react";
import type { WebsiteSettings } from "@/lib/database.types";

/**
 * Turns a business's two brand colours and its light/dark preference into the
 * CSS custom properties the whole public site is built on.
 *
 * Two ideas make this work for any business without hand-tuning:
 *
 * 1. The neutral scale is *semantic*, not literal. `ink-50` always means
 *    "closest to the foreground" and `ink-950` "closest to the background", so
 *    the same `text-ink-50` / `bg-ink-950` classes render near-white on
 *    near-black in dark mode and near-black on ivory in light mode. No
 *    component knows which mode it is in.
 *
 * 2. Accent colours are checked for contrast against the page surface and
 *    darkened or lightened until they are readable (WCAG AA, 4.5:1 for text).
 *    A pale gold that sings on charcoal would be invisible on ivory; the owner
 *    shouldn't have to know that.
 */

export const DEFAULT_PRIMARY = "#6a0f1f";
export const DEFAULT_SECONDARY = "#d4af37";

export type ColorMode = "dark" | "light";

const HEX = /^#[0-9a-f]{6}$/i;

export function normalizeHex(value: string | null | undefined, fallback: string): string {
  const candidate = (value ?? "").trim();
  return HEX.test(candidate) ? candidate.toLowerCase() : fallback;
}

function toRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const channels = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** WCAG contrast ratio between two colours, 1 (identical) to 21 (black/white). */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

function mix(from: string, to: string, amount: number): string {
  const [r1, g1, b1] = toRgb(from);
  const [r2, g2, b2] = toRgb(to);
  return toHex([
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount,
  ]);
}

/**
 * Nudges `color` towards black or white — whichever direction increases
 * contrast against `background` — until it meets `target`, keeping as much of
 * the original hue as possible.
 */
export function ensureReadable(color: string, background: string, target: number): string {
  if (contrastRatio(color, background) >= target) return color;
  const towards = luminance(background) > 0.4 ? "#120c0d" : "#fffaf2";
  for (let amount = 0.06; amount <= 1; amount += 0.06) {
    const candidate = mix(color, towards, amount);
    if (contrastRatio(candidate, background) >= target) return candidate;
  }
  return towards;
}

/**
 * The neutral surfaces, ordered foreground (50) to background (950). Warm on
 * both sides: a cosmetics brand's photography sits badly on a blue-grey.
 */
const SURFACES: Record<ColorMode, string[]> = {
  // 50 …………………………………………………………………………………………………………………… 950
  dark: [
    "#f8f3ea", "#ece4d6", "#d6ccbd", "#b4a99a", "#8d8276",
    "#6d6359", "#514942", "#3a332f", "#262120", "#151113", "#08060a",
  ],
  // Tuned so every step used for text clears WCAG AA on this surface:
  // 300 and 400 carry body copy, 500 small captions, 600 placeholders.
  light: [
    "#1b1211", "#2a1d1c", "#3c2c2a", "#4d3b37", "#5c4a45",
    "#6f5c56", "#93807a", "#c3aea6", "#e2d3cc", "#f3eae5", "#fbf6f3",
  ],
};

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export interface BrandTheme {
  mode: ColorMode;
  primary: string;
  secondary: string;
  /** "r, g, b" triplets, for rgba() and canvas particle colours. */
  primaryRgb: string;
  secondaryRgb: string;
  /** Accent adjusted to be readable as text on this mode's page surface. */
  accentText: string;
  accentTextRgb: string;
  /** Readable foreground for each brand colour used as a background. */
  onPrimary: string;
  onSecondary: string;
  /** The page background — handy for computing further colours. */
  surface: string;
  /** Inline style for the site wrapper. */
  style: CSSProperties;
}

export function buildBrandTheme(
  settings: Pick<WebsiteSettings, "primary_color" | "secondary_color" | "color_mode"> | null,
): BrandTheme {
  const mode: ColorMode = settings?.color_mode === "light" ? "light" : "dark";
  const primary = normalizeHex(settings?.primary_color, DEFAULT_PRIMARY);
  const secondary = normalizeHex(settings?.secondary_color, DEFAULT_SECONDARY);

  const scale = SURFACES[mode];
  const surface = scale[scale.length - 1];
  const foreground = scale[0];

  // Text-sized accent needs 4.5:1; large display type and borders 3:1.
  const accentText = ensureReadable(secondary, surface, 4.5);
  const accentDisplay = ensureReadable(secondary, surface, 3);
  const brandText = ensureReadable(primary, surface, 4.5);

  const onPrimary = contrastRatio("#fdf8ef", primary) >= 4.5 ? "#fdf8ef" : "#14100f";
  const onSecondary = contrastRatio("#fdf8ef", secondary) >= 4.5 ? "#fdf8ef" : "#14100f";

  const surfaceVars = Object.fromEntries(
    STEPS.map((step, index) => [`--ink-${step}`, scale[index]]),
  );

  return {
    mode,
    primary,
    secondary,
    primaryRgb: toRgb(primary).join(", "),
    secondaryRgb: toRgb(secondary).join(", "),
    accentText,
    accentTextRgb: toRgb(accentText).join(", "),
    onPrimary,
    onSecondary,
    surface,
    style: {
      ...surfaceVars,
      "--brand-primary": primary,
      "--brand-primary-rgb": toRgb(primary).join(", "),
      "--brand-primary-text": brandText,
      "--brand-secondary": secondary,
      "--brand-secondary-rgb": toRgb(secondary).join(", "),
      // What accents look like as text/borders on this mode's surface.
      "--brand-accent-text": accentText,
      "--brand-accent-display": accentDisplay,
      "--brand-on-primary": onPrimary,
      "--brand-on-secondary": onSecondary,
      "--foreground": foreground,
      "--background": surface,
      // How strongly the brand colour tints the hero stage: a deep wash on
      // dark, a soft veil on light so pale product photography still reads.
      "--stage-mix": mode === "light" ? "16%" : "78%",
      "--stage-mix-soft": mode === "light" ? "8%" : "42%",
      // Bloom reads as light *emitted* on a dark page and as ink *bleeding* on
      // a pale one, so light-mode businesses get a much gentler version.
      "--glow-opacity": mode === "light" ? "0.4" : "1",
      colorScheme: mode,
    } as CSSProperties,
  };
}
