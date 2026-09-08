"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { uploadMedia } from "@/lib/actions/media";

export function MediaUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
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
          className="block w-full text-sm text-charcoal-600 file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-charcoal-700 hover:file:bg-charcoal-200"
        />
      </div>
      <Button type="submit" loading={isPending}>
        <UploadCloud className="size-4" aria-hidden /> Upload
      </Button>
    </form>
  );
}
