/**
 * Contact-link helpers shared by the public site.
 *
 * Owners type phone numbers however they like ("+961 71 234 567",
 * "(01) 234-567"), so anything that has to become a URL is normalized here
 * rather than at each call site.
 */

/** Builds a wa.me link, or null when there's no usable number. Returning null
 * is what lets callers skip the field entirely instead of rendering an empty
 * contact row. */
export function whatsappUrl(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/[^\d]/g, "");
  // Shorter than this is a typo or an extension, not a reachable number.
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

export function telHref(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : null;
}

export function mapsUrl(address: string | null | undefined): string | null {
  const trimmed = (address ?? "").trim();
  if (!trimmed) return null;
  return `https://maps.google.com/?q=${encodeURIComponent(trimmed)}`;
}
