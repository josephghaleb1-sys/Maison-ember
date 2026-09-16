"use server";

import { revalidatePath } from "next/cache";
import { revalidateGallery } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { uploadBusinessImage, deleteBusinessImage } from "@/lib/actions/upload";
import type { MediaKind } from "@/lib/database.types";

const VALID_KINDS: MediaKind[] = ["product", "gallery", "logo", "hero", "other"];

function revalidateAll() {
  revalidatePath("/admin/media");
  revalidateGallery();
}

export async function uploadMedia(formData: FormData): Promise<{ error?: string }> {
  const { business, userId } = await requireBusinessContext();

  const kindValue = formData.get("kind");
  const kind = VALID_KINDS.includes(kindValue as MediaKind) ? (kindValue as MediaKind) : "gallery";
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { error: "Choose at least one image to upload." };
  }

  const supabase = await createClient();
  const errors: string[] = [];

  for (const file of files) {
    const result = await uploadBusinessImage(supabase, business.id, userId, kind, file);
    if ("error" in result) errors.push(`${file.name}: ${result.error}`);
  }

  revalidateAll();

  if (errors.length > 0) {
    return { error: errors.join(" ") };
  }
  return {};
}

export async function deleteMedia(mediaId: string): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("media")
    .select("storage_path")
    .eq("id", mediaId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!existing) return { error: "File not found." };

  await deleteBusinessImage(supabase, existing.storage_path);
  revalidateAll();
  return {};
}

export async function setMediaVisibility(mediaId: string, isVisible: boolean): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("media")
    .update({ is_visible: isVisible })
    .eq("id", mediaId)
    .eq("business_id", business.id);

  if (error) return { error: error.message };
  revalidateAll();
  return {};
}

export async function updateMediaAlt(mediaId: string, altText: string): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("media")
    .update({ alt_text: altText.trim().slice(0, 300) })
    .eq("id", mediaId)
    .eq("business_id", business.id);

  if (error) return { error: error.message };
  revalidateAll();
  return {};
}
