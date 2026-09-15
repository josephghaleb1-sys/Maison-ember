import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Postgres `numeric` reaches the client as a JSON number through PostgREST,
 * but as a string through some drivers and proxies. Anything that does
 * arithmetic on money coerces here first — `18 + "3.00"` is "183.00", a bug
 * worth making impossible rather than assuming a serialiser.
 */
export function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Money, in the business's own currency (website_settings.currency).
 * Falls back to plain formatting if a currency code is ever invalid, so a bad
 * setting can never crash a page.
 */
export function formatPrice(value: number | string, currency = "USD"): string {
  const amount = toNumber(value);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
