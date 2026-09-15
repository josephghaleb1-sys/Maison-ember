"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { uploadBusinessImage, deleteBusinessImage } from "@/lib/actions/upload";
import { CATALOG_PATHS } from "@/lib/industry";
import type { MediaKind } from "@/lib/database.types";

const VALID_KINDS: MediaKind[] = ["product", "gallery", "logo", "hero", "og", "other"];

function revalidateAll() {
  revalidatePath("/admin/media");
  revalidatePath("/gallery");
  revalidatePath("/about");
  revalidatePath("/");
}

/**
 * Records files the browser has already put in storage.
 *
 * Uploads go straight from the browser to Supabase Storage rather than through
 * a Server Action: a handful of phone photos easily exceeds the Server Action
 * body limit, and routing megabytes through the server only to forward them
 * again is slower for the owner and pointless. Storage RLS still decides who
 * may write where (the path's first segment is the business id), and this
 * action re-checks every path before it records anything — a client cannot
 * register a file that isn't inside its own business's folder.
 */
export async function registerUploadedMedia(
  paths: string[],
  kind: string,
  fileNames: string[],
  sizes: number[],
  mimeTypes: string[],
): Promise<{ error?: string; added?: number }> {
  const { business, userId } = await requireBusinessContext();

  const mediaKind = VALID_KINDS.includes(kind as MediaKind) ? (kind as MediaKind) : "gallery";
  if (paths.length === 0) return { error: "Nothing was uploaded." };
  if (paths.length > 20) return { error: "Too many files at once — upload up to 20." };

  const prefix = `${business.id}/`;
  if (paths.some((path) => !path.startsWith(prefix))) {
    return { error: "Those files don't belong to this business." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("media").insert(
    paths.map((path, index) => ({
      business_id: business.id,
      storage_path: path,
      file_name: fileNames[index] ?? path.split("/").pop() ?? "image",
      mime_type: mimeTypes[index] ?? "image/jpeg",
      size_bytes: sizes[index] ?? 0,
      kind: mediaKind,
      uploaded_by: userId,
    })),
  );

  if (error) {
    // The files are in storage but unrecorded; clean them up so the library
    // and the bucket can't drift apart.
    await Promise.all(paths.map((path) => deleteBusinessImage(supabase, path)));
    return { error: `Couldn't save the uploads: ${error.message}` };
  }

  revalidateAll();
  return { added: paths.length };
}

/** Server-side upload, still used by the single-image fields on forms. */
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
    if ("error" in result) errors.push(result.error);
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

  // Anything still pointing at this file would render as a broken image, so
  // clear those references first — products that used it simply fall back to
  // the designed placeholder.
  const path = existing.storage_path;
  const { data: settings } = await supabase
    .from("website_settings")
    .select("logo_path, hero_image_path, og_image_path")
    .eq("business_id", business.id)
    .maybeSingle();

  await Promise.all([
    supabase
      .from("products")
      .update({ image_path: null })
      .eq("business_id", business.id)
      .eq("image_path", path),
    settings &&
    (settings.logo_path === path ||
      settings.hero_image_path === path ||
      settings.og_image_path === path)
      ? supabase
          .from("website_settings")
          .update({
            logo_path: settings.logo_path === path ? null : settings.logo_path,
            hero_image_path: settings.hero_image_path === path ? null : settings.hero_image_path,
            og_image_path: settings.og_image_path === path ? null : settings.og_image_path,
          })
          .eq("business_id", business.id)
      : Promise.resolve(),
  ]);

  await deleteBusinessImage(supabase, path);

  revalidateAll();
  revalidatePath("/admin/products");
  for (const catalogPath of CATALOG_PATHS) revalidatePath(catalogPath);
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
