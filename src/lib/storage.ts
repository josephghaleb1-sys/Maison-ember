const MEDIA_BUCKET = "media";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB, matches the bucket's file_size_limit
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

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
