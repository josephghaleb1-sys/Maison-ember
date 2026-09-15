const MEDIA_BUCKET = "media";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB, matches the bucket's file_size_limit

/**
 * SVG is deliberately excluded. It can carry script, and Supabase serves it
 * from a shared *.supabase.co origin with its real content type — a needless
 * risk for a shop that only ever uploads photographs and a logo.
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/** For the `accept` attribute of file inputs. */
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

/**
 * Turns the errors storage actually returns into something a shop owner can
 * act on. The raw messages ("new row violates row-level security policy for
 * table objects") are accurate and useless.
 */
export function describeUploadError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("row-level security") || text.includes("unauthorized") || text.includes("403")) {
    return "Storage permissions aren't set up yet. In Supabase: Storage → Policies → add the four media policies from the README (\"If photo uploads fail\").";
  }
  if (text.includes("bucket not found") || text.includes("404")) {
    return "The \"media\" storage bucket is missing. In Supabase: Storage → New bucket → name it \"media\" and turn Public on.";
  }
  if (text.includes("exceeded") || text.includes("too large") || text.includes("413")) {
    return "That photo is too large even after optimising. Max size is 5MB.";
  }
  if (text.includes("mime") || text.includes("invalid_mime") || text.includes("content type")) {
    return "That file type isn't supported. Use a JPG, PNG, WebP or GIF.";
  }
  if (text.includes("duplicate") || text.includes("already exists")) {
    return "That file already exists. Try uploading it again.";
  }
  if (text.includes("failed to fetch") || text.includes("network")) {
    return "The upload lost its connection. Check your internet and try again.";
  }
  return `Upload failed: ${message}`;
}

/** A human explanation of why a specific file can't be uploaded, or null. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    // iPhones can hand over HEIC when a photo is picked from Files rather than
    // the photo library, and no browser but Safari can read it.
    if (file.type === "image/heic" || file.type === "image/heif" || /\.hei[cf]$/i.test(file.name)) {
      return `${file.name} is an iPhone HEIC photo. On your iPhone open Settings → Camera → Formats → "Most Compatible", or send the photo to yourself on WhatsApp first — both give a JPG.`;
    }
    return `${file.name} isn't a supported image. Use a JPG, PNG, WebP or GIF.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `${file.name} is ${mb}MB — too large even after optimising. Max is 5MB.`;
  }
  return null;
}

/** Build the public URL for a file stored in the "media" bucket. */
export function getPublicMediaUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}`;
}

/** Storage paths are namespaced "{businessId}/{kind}/{filename}" so the
 * storage.objects RLS policies can scope access by business. */
export function buildStoragePath(
  businessId: string,
  kind: string,
  fileName: string,
): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  const safeExt = ext ? `.${ext.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
  const unique = crypto.randomUUID();
  return `${businessId}/${kind}/${unique}${safeExt}`;
}

export function isAllowedImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

export { MEDIA_BUCKET };
