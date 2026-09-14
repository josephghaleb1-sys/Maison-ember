/**
 * Contact-link helpers shared by the public site.
 *
 * Phone numbers are stored exactly as the owner typed them (spaces, dashes,
 * "+961 70 349 245"), which is right for display but not for links — these
 * turn them into valid tel:/wa.me targets.
 */

/** Digits only, dropping a leading "00" international prefix. */
export function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/[^\d]/g, "");
  return digits.startsWith("00") ? digits.slice(2) : digits;
}

/** https://wa.me/<number> — or null when there's no usable number. */
export function whatsappHref(value: string | null | undefined, message?: string): string | null {
  const digits = normalizePhone(value);
  if (digits.length < 6) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
