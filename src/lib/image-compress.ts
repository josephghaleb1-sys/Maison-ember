/**
 * Browser-only: resizes + recompresses an image File before upload, so a
 * multi-MB phone camera photo doesn't have to travel over the network at
 * full size. Only ever call this from Client Components.
 *
 * Kept deliberately conservative:
 * - SVG and GIF pass through untouched (vector art shouldn't be rasterized;
 *   GIFs may be animated and canvas would flatten them to one frame).
 * - PNG stays PNG (so logos with transparency don't get flattened onto a
 *   solid background) — only its dimensions are capped.
 * - JPEG/WebP get resized and recompressed at `quality`.
 * - If compression ever fails, or the result isn't actually smaller, the
 *   original file is returned — this must never be the reason an upload
 *   breaks.
 */
export async function compressImageFile(
  file: File,
  { maxDimension = 1600, quality = 0.82 }: { maxDimension?: number; quality?: number } = {},
): Promise<File> {
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const isLossyType = file.type === "image/jpeg" || file.type === "image/webp";

    if (scale >= 1 && !isLossyType) {
      bitmap.close();
      return file;
    }

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, outputType === "image/jpeg" ? quality : undefined),
    );

    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name, { type: outputType, lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** Compresses every file in a FileList-like array, in parallel. */
export async function compressImageFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => compressImageFile(file)));
}
