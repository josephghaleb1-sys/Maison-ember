"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/input";
import { Thumb } from "@/components/admin/thumb";
import { compressImageFile } from "@/lib/image-compress";

/**
 * Single-image picker with preview, client-side downscaling and a "remove"
 * checkbox. Shared by every admin form that manages one image, so the upload
 * behaviour (and its size limits) stays identical across them.
 */
export function ImageField({
  name,
  label,
  currentPath,
  hint,
  maxDimension = 800,
}: {
  name: string;
  label: string;
  currentPath: string | null;
  hint: string;
  /** Longest edge kept after client-side downscaling, before upload. */
  maxDimension?: number;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  return (
    <div>
      <Label htmlFor={`${name}_image`}>{label}</Label>
      <div className="flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Selected preview" className="size-16 rounded-lg object-cover" />
        ) : (
          !remove && <Thumb path={currentPath} alt={label} size={64} />
        )}
        <div className="flex-1">
          <input
            id={`${name}_image`}
            name={`${name}_image`}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="block w-full text-sm text-charcoal-300 file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-charcoal-200 hover:file:bg-charcoal-700"
            onChange={async (e) => {
              const input = e.target;
              const file = input.files?.[0];
              setRemove(false);
              if (!file) {
                setPreview(null);
                return;
              }
              setPreview(URL.createObjectURL(file));
              setIsCompressing(true);
              const compressed = await compressImageFile(file, { maxDimension });
              setIsCompressing(false);
              // Swap the compressed file back into the input so the form
              // submits the smaller version, not the original.
              if (compressed !== file) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(compressed);
                input.files = dataTransfer.files;
              }
            }}
          />
          <p className="mt-1 text-xs text-charcoal-500">
            {isCompressing ? "Optimizing image…" : hint}
          </p>
        </div>
      </div>
      {currentPath && !preview && (
        <label className="mt-2 flex items-center gap-2 text-sm text-charcoal-300">
          <input
            type="checkbox"
            name={`remove_${name}_image`}
            checked={remove}
            onChange={(e) => setRemove(e.target.checked)}
            className="rounded border-charcoal-600"
          />
          <X className="size-3.5" aria-hidden /> Remove current image
        </label>
      )}
    </div>
  );
}
