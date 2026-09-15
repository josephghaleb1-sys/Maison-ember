"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, UploadCloud, XCircle } from "lucide-react";
import { Select, Label } from "@/components/ui/input";
import { registerUploadedMedia } from "@/lib/actions/media";
import { compressImageFile } from "@/lib/image-compress";
import { createClient } from "@/lib/supabase/client";
import {
  IMAGE_ACCEPT,
  MEDIA_BUCKET,
  buildStoragePath,
  describeUploadError,
  validateImageFile,
} from "@/lib/storage";

type FileState = {
  name: string;
  status: "waiting" | "optimising" | "uploading" | "done" | "failed";
  error?: string;
};

/**
 * Uploads photos straight from the browser to Supabase Storage, one at a time,
 * then records them in one go.
 *
 * Going direct matters: a few photos off a phone comfortably exceed the Server
 * Action body limit, and a whole batch failing because one file tipped it over
 * is exactly the kind of error that makes the dashboard feel broken. Here each
 * file is optimised, uploaded and reported on its own — a bad file fails alone
 * and says why.
 */
export function MediaUploadForm({ businessId }: { businessId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState("gallery");
  const [progress, setProgress] = useState<FileState[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    if (files.length > 20) {
      toast.error("Up to 20 photos at a time.");
      return;
    }

    const supabase = createClient();
    const states: FileState[] = files.map((file) => ({ name: file.name, status: "waiting" }));
    setProgress(states);

    const uploaded: { path: string; name: string; size: number; type: string }[] = [];

    for (const [index, original] of files.entries()) {
      const update = (patch: Partial<FileState>) =>
        setProgress((current) =>
          current.map((state, i) => (i === index ? { ...state, ...patch } : state)),
        );

      update({ status: "optimising" });
      const file = await compressImageFile(original, { maxDimension: 2000 });

      const invalid = validateImageFile(file);
      if (invalid) {
        update({ status: "failed", error: invalid });
        continue;
      }

      update({ status: "uploading" });
      const path = buildStoragePath(businessId, kind, file.name);
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

      if (error) {
        update({ status: "failed", error: describeUploadError(error.message) });
        continue;
      }

      uploaded.push({ path, name: file.name, size: file.size, type: file.type });
      update({ status: "done" });
    }

    if (uploaded.length === 0) {
      toast.error("Nothing could be uploaded — see the notes below.");
      return;
    }

    startTransition(async () => {
      const result = await registerUploadedMedia(
        uploaded.map((item) => item.path),
        kind,
        uploaded.map((item) => item.name),
        uploaded.map((item) => item.size),
        uploaded.map((item) => item.type),
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        uploaded.length === 1 ? "Photo uploaded." : `${uploaded.length} photos uploaded.`,
      );
      if (inputRef.current) inputRef.current.value = "";
      setProgress((current) => current.filter((state) => state.status === "failed"));
      router.refresh();
    });
  }

  const busy = isPending || progress.some((s) => s.status === "optimising" || s.status === "uploading");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:w-44">
          <Label htmlFor="kind">Type</Label>
          <Select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="gallery">Gallery (public)</option>
            <option value="product">Product photos</option>
            <option value="hero">Hero image</option>
            <option value="logo">Logo</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="files">Photos</Label>
          <input
            ref={inputRef}
            id="files"
            name="files"
            type="file"
            multiple
            accept={IMAGE_ACCEPT}
            disabled={busy}
            onChange={(event) => handleFiles(event.target.files)}
            className="block w-full text-sm text-ink-300 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink-200 hover:file:bg-ink-700 disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-ink-500">
            JPG, PNG, WebP or GIF, up to 5MB each. Big photos are shrunk automatically before
            they upload.
          </p>
        </div>
        {/* The file input is the control; a second button beside it would be
            redundant, so this is just a status line. */}
        <p className="flex items-center gap-2 pb-2.5 text-sm text-ink-400 sm:w-36">
          <UploadCloud className={busy ? "size-4 animate-pulse text-accent" : "size-4"} aria-hidden />
          {busy ? "Uploading…" : "Ready"}
        </p>
      </div>

      {progress.length > 0 && (
        <ul className="space-y-1.5 text-sm" aria-live="polite">
          {progress.map((state, index) => (
            <li key={`${state.name}-${index}`} className="flex items-start gap-2">
              {state.status === "done" && (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-400" aria-hidden />
              )}
              {state.status === "failed" && (
                <XCircle className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
              )}
              <span className="min-w-0">
                <span className="text-ink-200">{state.name}</span>
                {state.status === "optimising" && (
                  <span className="text-ink-500"> — optimising…</span>
                )}
                {state.status === "uploading" && (
                  <span className="text-ink-500"> — uploading…</span>
                )}
                {state.error && <span className="block text-red-400">{state.error}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
