"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { uploadMedia } from "@/lib/actions/media";
import { compressImageFiles } from "@/lib/image-compress";

export function MediaUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isCompressing, setIsCompressing] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length > 0) {
      setIsCompressing(true);
      const compressed = await compressImageFiles(files);
      setIsCompressing(false);
      formData.delete("files");
      compressed.forEach((file) => formData.append("files", file));
    }

    startTransition(async () => {
      const result = await uploadMedia(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      formRef.current?.reset();
      toast.success("Upload complete.");
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="w-full sm:w-40">
        <Label htmlFor="kind">Type</Label>
        <Select id="kind" name="kind" defaultValue="gallery">
          <option value="gallery">Gallery (public)</option>
          <option value="hero">Hero image</option>
          <option value="logo">Logo</option>
          <option value="other">Other</option>
        </Select>
      </div>
      <div className="flex-1">
        <Label htmlFor="files">Images</Label>
        <input
          id="files"
          name="files"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="block w-full text-sm text-charcoal-300 file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-charcoal-200 hover:file:bg-charcoal-700"
        />
      </div>
      <Button type="submit" loading={isPending || isCompressing}>
        <UploadCloud className="size-4" aria-hidden />
        {isCompressing ? "Optimizing…" : "Upload"}
      </Button>
    </form>
  );
}
