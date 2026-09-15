"use client";

import Image from "next/image";
import { Check, Images, X } from "lucide-react";
import type { Media } from "@/lib/database.types";
import { getPublicMediaUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Choose an existing image from the media library instead of uploading a new
 * one. Emits the media row's **id** (not a storage path) so the server can
 * verify ownership before using it.
 */
export function MediaPicker({
  media,
  selectedId,
  onSelect,
  onClose,
}: {
  media: Media[];
  selectedId: string | null;
  onSelect: (item: Media | null) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose an image"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-t-2xl border border-ink-800 bg-ink-900 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-ink-800 p-4">
          <h2 className="text-base font-semibold text-ink-50">Media library</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-ink-400 hover:bg-ink-800"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {media.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Images className="size-8 text-ink-500" aria-hidden />
              <p className="text-sm text-ink-400">
                Nothing in your library yet. Upload photos from the Media page, or pick a file
                below.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {media.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className={cn(
                        "relative block aspect-square w-full overflow-hidden rounded-lg border-2 transition-colors",
                        isSelected ? "border-accent" : "border-transparent hover:border-ink-600",
                      )}
                    >
                      <Image
                        src={getPublicMediaUrl(item.storage_path)}
                        alt={item.alt_text || item.file_name}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                      {isSelected && (
                        <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-accent-solid text-on-accent">
                          <Check className="size-3" aria-hidden />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-800 p-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
