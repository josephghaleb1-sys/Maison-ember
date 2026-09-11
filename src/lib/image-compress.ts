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
 * - Dimensions are read from a lightweight `<img>` decode first, and the
 *   actual resize happens via `createImageBitmap`'s `resizeWidth/Height`
 *   options rather than decoding the full-resolution image into a bitmap
 *   and scaling it down afterwards — modern phone cameras produce 12-48MP
 *   photos, and materializing one of those at full size (before it's ever
 *   downscaled) is enough to crash the tab on memory-constrained mobile
 *   browsers.
 */
export async function compressImageFile(
  file: File,
  { maxDimension = 1600, quality = 0.82 }: { maxDimension?: number; quality?: number } = {},
): Promise<File> {
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(file);
    const { width: naturalWidth, height: naturalHeight } = await readImageDimensions(objectUrl);

    const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
    const isLossyType = file.type === "image/jpeg" || file.type === "image/webp";

    if (scale >= 1 && !isLossyType) return file;

    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));

    const bitmap = await createImageBitmap(file, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: "high",
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, outputType === "image/jpeg" ? quality : undefined),
    );

    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name, { type: outputType, lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

function readImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not read image dimensions."));
    img.src = src;
  });
}

/** Compresses every file in a FileList-like array, in parallel. */
export async function compressImageFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => compressImageFile(file)));
}
