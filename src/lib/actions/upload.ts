import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MEDIA_BUCKET,
  buildStoragePath,
  describeUploadError,
  validateImageFile,
} from "@/lib/storage";
import type { Database, MediaKind } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

export async function uploadBusinessImage(
  supabase: Client,
  businessId: string,
  userId: string,
  kind: MediaKind,
  file: File,
): Promise<{ path: string } | { error: string }> {
  const invalid = validateImageFile(file);
  if (invalid) return { error: invalid };

  const path = buildStoragePath(businessId, kind, file.name);
  const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return { error: describeUploadError(uploadError.message) };
  }

  const { error: insertError } = await supabase.from("media").insert({
    business_id: businessId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    kind,
    uploaded_by: userId,
  });

  if (insertError) {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    return { error: `Could not save file record: ${insertError.message}` };
  }

  return { path };
}

/**
 * Removes a storage object and its media library row, if any. Best-effort,
 * and the two deletes are independent of each other (neither depends on the
 * other's result) so they run in parallel rather than one after another.
 */
export async function deleteBusinessImage(supabase: Client, path: string) {
  await Promise.all([
    supabase.storage.from(MEDIA_BUCKET).remove([path]),
    supabase.from("media").delete().eq("storage_path", path),
  ]);
}
