/**
 * Turns a business's two brand colors into the CSS custom properties the
 * public site is built on.
 *
 * Why this exists: the site used to hard-code one restaurant's palette into
 * ~30 components. Themes now come from `website_settings`, so changing a
 * business's look is a dashboard edit, not a code change.
 *
 * The hard part is not generating colors, it's guaranteeing *readable* ones
 * for a palette nobody reviewed. An owner can pick any two hex values,
 * including a mid-tone gold that is too dark for white text and too light for
 * black. So every color that carries text is solved here against an explicit
 * WCAG contrast target rather than being mixed by eye:
 *
 *   - text tokens are emitted as concrete hex, so their contrast is exact
 *   - decorative tokens (surfaces, borders, tints) use CSS color-mix(), where
 *     the browser blends perceptually and small drift doesn't matter
 */

const HEX = /^#[0-9A-Fa-f]{6}$/;

export const DEFAULT_PRIMARY = "#B08D57";
export const DEFAULT_SECONDARY = "#F4F0E8";

/** WCAG AA for normal-size text. */
const AA_TEXT = 4.5;
/** Body copy aims well past the minimum; muted copy sits at it. */
const BODY_TARGET = 11;
const FAINT_TARGET = 3;

/**
 * Rejects anything that isn't a 6-digit hex literal. The value is
 * interpolated into a <style> tag, so this is a security boundary as well as
 * a correctness one — it mirrors the CHECK constraints in migration 0003.
 */
export function safeHex(value: string | null | undefined, fallback: string): string {
  const candidate = (value ?? "").trim();
  return HEX.test(candidate) ? candidate : fallback;
}

type Rgb = [number, number, number];

function toRgb(hex: string): Rgb {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function toHex([r, g, b]: Rgb): string {
  const part = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0").toUpperCase();
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colors, 1:1 to 21:1. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function blend(from: string, to: string, t: number): string {
  const a = toRgb(from);
  const b = toRgb(to);
  return toHex([
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]);
}

/**
 * Black or white — whichever is actually more readable on `hex`.
 *
 * The crossover is at luminance ≈ 0.179, where contrast against black and
 * against white are equal. Picking by "is it darker than mid-grey?" (0.45 or
 * 0.5) looks reasonable but is wrong for exactly the mid-tone brand colors
 * businesses like most: a #C8A44D button would take white text at 2.4:1 when
 * black would have given 8.9:1.
 */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.179 ? "#10100E" : "#FFFFFF";
}

/**
 * Nudges `base` toward `toward` until it reaches `target` contrast against
 * `against`, and returns the first value that does.
 *
 * Binary search rather than a fixed blend, because how far a color has to
 * move depends entirely on the palette: a pale gold on ivory needs to travel
 * a long way to be readable, a deep oxblood barely moves.
 */
function solveContrast(
  base: string,
  toward: string,
  against: string,
  target: number,
): string {
  if (contrastRatio(base, against) >= target) return base;
  // If even the extreme can't hit the target, return it — the best available.
  if (contrastRatio(toward, against) < target) return toward;

  let low = 0;
  let high = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (low + high) / 2;
    if (contrastRatio(blend(base, toward, mid), against) >= target) high = mid;
    else low = mid;
  }
  return blend(base, toward, high);
}

export interface ThemeInput {
  primary_color?: string | null;
  secondary_color?: string | null;
}

/** Whether the resolved surface is dark, for components that need to pick an
 * asset or overlay strength rather than a color. */
export function isDarkTheme(settings: ThemeInput | null): boolean {
  return luminance(safeHex(settings?.secondary_color, DEFAULT_SECONDARY)) < 0.4;
}

/**
 * Builds the `:root` declaration block for a business.
 *
 * `secondary_color` is the page surface. Dark and light surfaces are handled
 * as separate cases rather than one mirrored formula — the amounts that make
 * a border subtle or a heading strong are genuinely different in each
 * direction, and an earlier mirrored version produced #D7D3CC body text on
 * ivory (1.3:1, effectively invisible).
 */
export function buildThemeCss(settings: ThemeInput | null): string {
  const primary = safeHex(settings?.primary_color, DEFAULT_PRIMARY);
  const surface = safeHex(settings?.secondary_color, DEFAULT_SECONDARY);

  const dark = luminance(surface) < 0.4;
  // The direction text and borders travel to separate from the surface.
  const away = dark ? "#FFFFFF" : "#000000";

  // Body text keeps a hint of the brand so the page reads as one palette
  // rather than black-on-a-colored-background, then is pushed until readable.
  const inkBase = blend(surface, primary, 0.14);
  const ink = solveContrast(inkBase, away, surface, BODY_TARGET);
  const inkMuted = solveContrast(inkBase, away, surface, AA_TEXT);
  const inkFaint = solveContrast(inkBase, away, surface, FAINT_TARGET);

  // Brand-colored text has to clear AA against the surface too. On a light
  // theme this darkens the gold; on a dark theme it lightens it.
  const brandInk = solveContrast(primary, away, surface, AA_TEXT);

  const declarations: Record<string, string> = {
    "--brand": primary,
    // Button hover: always a step darker than the brand on a light surface,
    // a step lighter on a dark one.
    "--brand-strong": blend(primary, dark ? "#FFFFFF" : "#000000", 0.18),
    "--brand-ink": brandInk,
    "--brand-tint": `color-mix(in oklab, ${primary} ${dark ? 14 : 12}%, transparent)`,
    "--brand-line": `color-mix(in oklab, ${primary} ${dark ? 42 : 46}%, transparent)`,
    "--on-brand": readableOn(primary),

    "--surface": surface,
    "--surface-1": `color-mix(in oklab, ${surface} ${dark ? 94 : 97}%, ${away})`,
    "--surface-2": `color-mix(in oklab, ${surface} ${dark ? 88 : 94}%, ${away})`,
    "--surface-3": `color-mix(in oklab, ${surface} ${dark ? 80 : 89}%, ${away})`,

    "--ink": ink,
    "--ink-muted": inkMuted,
    "--ink-faint": inkFaint,

    "--line": `color-mix(in oklab, ${surface} ${dark ? 86 : 91}%, ${away})`,
    "--line-strong": `color-mix(in oklab, ${surface} ${dark ? 72 : 80}%, ${away})`,

    // Hero scrim: the headline over a hero photo is white in both modes, so
    // this has to be genuinely dark even when the surface is ivory — it keeps
    // a trace of the brand's warmth rather than being flat black.
    "--hero-scrim": blend(surface, "#000000", dark ? 0.45 : 0.86),
  };

  return Object.entries(declarations)
    .map(([key, value]) => `${key}:${value};`)
    .join("");
}
