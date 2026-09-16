/**
 * Turns a business's two brand colors into the CSS custom properties the
 * public site is built on.
 *
 * Why this exists: the site used to hard-code one restaurant's gold/charcoal
 * palette into ~30 components. Themes now come from `website_settings`, so
 * changing a business's look is a dashboard edit, not a code change — which
 * is the whole point of a reusable platform.
 *
 * The derived steps use CSS `color-mix()` so the browser does the blending in
 * a perceptual space; only the decisions that CSS *can't* make on its own
 * (is this surface dark? does brand-colored text need black or white on top?)
 * are computed here in TypeScript.
 */

const HEX = /^#[0-9A-Fa-f]{6}$/;

export const DEFAULT_PRIMARY = "#C8A44D";
export const DEFAULT_SECONDARY = "#0E1420";

/** Rejects anything that isn't a 6-digit hex literal. The value is
 * interpolated into a <style> tag, so this is a security boundary as well as
 * a correctness one — it mirrors the CHECK constraints in migration 0003. */
export function safeHex(value: string | null | undefined, fallback: string): string {
  const candidate = (value ?? "").trim();
  return HEX.test(candidate) ? candidate : fallback;
}

function toRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Black or white — whichever stays readable on top of `hex`. */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.45 ? "#10100E" : "#FFFFFF";
}

export interface ThemeInput {
  primary_color?: string | null;
  secondary_color?: string | null;
}

/**
 * Builds the `:root` declaration block for a business.
 *
 * `secondary_color` is treated as the page surface. Businesses often pick a
 * dark luxury surface, but a light one has to work too, so every derived step
 * mixes *away* from the surface — toward white on a dark theme, toward black
 * on a light one.
 */
export function buildThemeCss(settings: ThemeInput | null): string {
  const primary = safeHex(settings?.primary_color, DEFAULT_PRIMARY);
  const secondary = safeHex(settings?.secondary_color, DEFAULT_SECONDARY);

  const surfaceIsDark = luminance(secondary) < 0.4;
  // The direction every derived surface/border/text step moves in.
  const away = surfaceIsDark ? "white" : "black";
  const toward = surfaceIsDark ? "black" : "white";

  const declarations: Record<string, string> = {
    "--brand": primary,
    "--brand-strong": `color-mix(in oklab, ${primary} 78%, ${toward})`,
    "--brand-soft": `color-mix(in oklab, ${primary} 62%, ${away})`,
    "--brand-tint": `color-mix(in oklab, ${primary} 14%, transparent)`,
    "--brand-line": `color-mix(in oklab, ${primary} 42%, transparent)`,
    "--on-brand": readableOn(primary),

    "--surface": secondary,
    "--surface-1": `color-mix(in oklab, ${secondary} 94%, ${away})`,
    "--surface-2": `color-mix(in oklab, ${secondary} 88%, ${away})`,
    "--surface-3": `color-mix(in oklab, ${secondary} 80%, ${away})`,

    "--ink": surfaceIsDark
      ? `color-mix(in oklab, ${primary} 8%, white)`
      : `color-mix(in oklab, ${secondary} 88%, black)`,
    "--ink-muted": `color-mix(in oklab, ${secondary} 42%, ${away})`,
    "--ink-faint": `color-mix(in oklab, ${secondary} 62%, ${away})`,

    "--line": `color-mix(in oklab, ${secondary} 84%, ${away})`,
    "--line-strong": `color-mix(in oklab, ${secondary} 70%, ${away})`,

    // Hero scrim: darkens a photo enough for white headline text regardless
    // of what the owner uploaded.
    "--hero-scrim": surfaceIsDark
      ? `color-mix(in oklab, ${secondary} 92%, black)`
      : `color-mix(in oklab, ${secondary} 70%, black)`,
  };

  return Object.entries(declarations)
    .map(([key, value]) => `${key}:${value};`)
    .join("");
}

/** Whether the resolved surface is dark, for components that need to pick an
 * asset or overlay strength rather than a color. */
export function isDarkTheme(settings: ThemeInput | null): boolean {
  return luminance(safeHex(settings?.secondary_color, DEFAULT_SECONDARY)) < 0.4;
}
