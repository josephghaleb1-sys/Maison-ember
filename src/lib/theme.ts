import type { CSSProperties } from "react";
import type { WebsiteSettings } from "@/lib/database.types";

/**
 * Turns a business's two brand colours (stored in website_settings) into the
 * CSS custom properties the whole public site is built on.
 *
 * Nothing in the component tree hard-codes a brand colour: components use
 * Tailwind utilities like `text-accent` / `bg-brand`, which resolve — via
 * `@theme inline` in globals.css — to these variables. Swap the two hex
 * values in the dashboard and the entire site re-skins.
 */

export const DEFAULT_PRIMARY = "#6a0f1f";
export const DEFAULT_SECONDARY = "#d4af37";

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

/** WCAG relative luminance — used to pick readable text on a brand colour. */
function luminance(hex: string): number {
  const channels = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export interface BrandTheme {
  primary: string;
  secondary: string;
  /** "r, g, b" triplets, for rgba() and canvas particle colours. */
  primaryRgb: string;
  secondaryRgb: string;
  /** Readable foreground on top of each brand colour. */
  onPrimary: string;
  onSecondary: string;
  /** Inline style for the site wrapper. */
  style: CSSProperties;
}

export function buildBrandTheme(settings: Pick<
  WebsiteSettings,
  "primary_color" | "secondary_color"
> | null): BrandTheme {
  const primary = normalizeHex(settings?.primary_color, DEFAULT_PRIMARY);
  const secondary = normalizeHex(settings?.secondary_color, DEFAULT_SECONDARY);
  const primaryRgb = toRgb(primary).join(", ");
  const secondaryRgb = toRgb(secondary).join(", ");
  const onPrimary = luminance(primary) > 0.45 ? "#14100f" : "#fdf8ef";
  const onSecondary = luminance(secondary) > 0.45 ? "#14100f" : "#fdf8ef";

  return {
    primary,
    secondary,
    primaryRgb,
    secondaryRgb,
    onPrimary,
    onSecondary,
    style: {
      "--brand-primary": primary,
      "--brand-primary-rgb": primaryRgb,
      "--brand-secondary": secondary,
      "--brand-secondary-rgb": secondaryRgb,
      "--brand-on-primary": onPrimary,
      "--brand-on-secondary": onSecondary,
    } as CSSProperties,
  };
}
