"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Media } from "@/lib/database.types";
import { getPublicMediaUrl } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { formatBytes, cn } from "@/lib/utils";
import { deleteMedia, setMediaVisibility, updateMediaAlt } from "@/lib/actions/media";

const kindLabels: Record<string, string> = {
  gallery: "Gallery",
  hero: "Hero",
  logo: "Logo",
  product: "Product",
  other: "Other",
};

export function MediaCard({ media }: { media: Media }) {
  const [altText, setAltText] = useState(media.alt_text);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function saveAlt() {
    if (altText === media.alt_text) return;
    startTransition(async () => {
      const result = await updateMediaAlt(media.id, altText);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-charcoal-800">
      <div className="relative aspect-square w-full bg-charcoal-800">
        <Image
          src={getPublicMediaUrl(media.storage_path)}
          alt={media.alt_text || media.file_name}
          fill
          sizes="(min-width: 1024px) 200px, 50vw"
          className="object-cover"
        />
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <Badge className={cn(media.kind === "gallery" && "bg-ember-500/15 text-ember-300")}>
            {kindLabels[media.kind] ?? media.kind}
          </Badge>
          <span className="text-xs text-charcoal-500">{formatBytes(media.size_bytes)}</span>
        </div>
        <input
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          onBlur={saveAlt}
          disabled={isPending}
          placeholder="Alt text (for accessibility)"
          className="w-full rounded-md border border-charcoal-700 px-2 py-1 text-xs text-charcoal-200 focus:border-ember-500 focus:outline-none disabled:opacity-60"
        />
        <div className="flex items-center justify-between">
          <VisibilityToggle
            checked={media.is_visible}
            label={`Toggle visibility for ${media.file_name}`}
            action={(next) => setMediaVisibility(media.id, next)}
          />
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" aria-label="Delete file">
                <Trash2 className="size-4 text-red-600" aria-hidden />
              </Button>
            }
            title="Delete this file?"
            description={`"${media.file_name}" will be permanently deleted from storage. Any product still pointing at it will show a placeholder.`}
            confirmLabel="Delete"
            action={() => deleteMedia(media.id)}
            successMessage="File deleted."
          />
        </div>
      </div>
    </div>
  );
}
