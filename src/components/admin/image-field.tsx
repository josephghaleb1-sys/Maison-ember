"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/input";
import { Thumb } from "@/components/admin/thumb";
import { compressImageFile } from "@/lib/image-compress";
import { IMAGE_ACCEPT, validateImageFile } from "@/lib/storage";

/**
 * File input for one branding image (logo / hero / social preview).
 *
 * Pictures straight off a phone are often 4-8MB; compressImageFile resizes
 * and re-encodes in the browser before upload, which keeps uploads fast and
 * within the 5MB storage limit. The preview shows immediately from the
 * original so the owner never waits on that work.
 */
export function ImageField({
  name,
  label,
  currentPath,
  hint,
  maxDimension = 1600,
}: {
  name: "logo" | "hero" | "og";
  label: string;
  currentPath: string | null;
  hint: string;
  maxDimension?: number;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  return (
    <div>
      <Label htmlFor={`${name}_image`}>{label}</Label>
      <div className="flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-16 rounded-lg object-cover" />
        ) : (
          !remove && <Thumb path={currentPath} alt={label} size={64} />
        )}
        <div className="min-w-0 flex-1">
          <input
            id={`${name}_image`}
            name={`${name}_image`}
            type="file"
            accept={IMAGE_ACCEPT}
            className="block w-full text-sm text-ink-300 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink-200 hover:file:bg-ink-700"
            onChange={async (event) => {
              const input = event.target;
              const file = input.files?.[0];
              setRemove(false);
              setProblem(null);
              if (!file) {
                setPreview(null);
                return;
              }
              setPreview(URL.createObjectURL(file));
              setIsCompressing(true);
              const compressed = await compressImageFile(file, { maxDimension });
              setIsCompressing(false);

              // Catch anything storage would reject *before* the form is sent,
              // so the owner isn't told after waiting for an upload.
              const invalid = validateImageFile(compressed);
              if (invalid) {
                setProblem(invalid);
                setPreview(null);
                input.value = "";
                return;
              }

              if (compressed !== file) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(compressed);
                input.files = dataTransfer.files;
              }
            }}
          />
          <p className="mt-1 text-xs text-ink-500">
            {isCompressing ? "Optimising image…" : hint}
          </p>
          {problem && <p className="mt-1 text-xs text-red-400">{problem}</p>}
        </div>
      </div>
      {currentPath && !preview && (
        <label className="mt-2 flex items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            name={`remove_${name}_image`}
            checked={remove}
            onChange={(event) => setRemove(event.target.checked)}
            className="rounded border-ink-600"
          />
          <X className="size-3.5" aria-hidden /> Remove current image
        </label>
      )}
    </div>
  );
}
