"use client";

import { useActionState, useState } from "react";
import { ImagePlus, Images, Tag, X } from "lucide-react";
import type { Category, Media, Product } from "@/lib/database.types";
import type { FormState } from "@/lib/actions/auth";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { Thumb } from "@/components/admin/thumb";
import { MediaPicker } from "@/components/admin/media-picker";
import { compressImageFile } from "@/lib/image-compress";
import { IMAGE_ACCEPT, validateImageFile } from "@/lib/storage";

const initialState: FormState = {};

export function ProductForm({
  product,
  categories,
  library,
  currency = "USD",
  itemNoun = "product",
  action,
}: {
  product?: Product;
  categories: Category[];
  /** Existing images the owner can reuse instead of uploading again. */
  library: Media[];
  currency?: string;
  itemNoun?: string;
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [picked, setPicked] = useState<Media | null>(null);
  const [photoProblem, setPhotoProblem] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={product?.name} required maxLength={120} />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={product?.description} rows={4} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">Price ({currency})</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price}
            required
          />
        </div>
        <div>
          <Label htmlFor="category_id">Category</Label>
          <Select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""}>
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="image">Photo</Label>
        <div className="flex items-center gap-3">
          {preview ? (
            <div className="relative size-16 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Selected preview" className="size-full object-cover" />
            </div>
          ) : (
            !removeImage && (
              <Thumb
                path={picked?.storage_path ?? product?.image_path ?? null}
                alt={product?.name ?? "Product"}
                size={64}
              />
            )
          )}
          <div className="flex-1">
            <input
              id="image"
              name="image"
              type="file"
              accept={IMAGE_ACCEPT}
              className="block w-full text-sm text-ink-300 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink-200 hover:file:bg-ink-700"
              onChange={async (e) => {
                const input = e.target;
                const file = input.files?.[0];
                setRemoveImage(false);
                setPicked(null);
                setPhotoProblem(null);
                if (!file) {
                  setPreview(null);
                  return;
                }
                // Show the original immediately — don't make the user wait
                // on compression just to see a preview.
                setPreview(URL.createObjectURL(file));
                setIsCompressing(true);
                const compressed = await compressImageFile(file);
                setIsCompressing(false);

                const invalid = validateImageFile(compressed);
                if (invalid) {
                  setPhotoProblem(invalid);
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
              {isCompressing ? "Optimising photo…" : "JPG, PNG, WebP or GIF. Max 5MB."}
            </p>
            {photoProblem && <p className="mt-1 text-xs text-red-400">{photoProblem}</p>}
          </div>
        </div>

        {/* Reuse an image already in the library instead of uploading twice. */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            <Images className="size-4" aria-hidden /> Choose from library
          </Button>
          {picked && (
            <span className="inline-flex items-center gap-2 text-xs text-ink-400">
              Using “{picked.file_name}”
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="text-ink-300 underline hover:text-ink-100"
              >
                clear
              </button>
            </span>
          )}
        </div>
        {picked && <input type="hidden" name="library_media_id" value={picked.id} />}

        {pickerOpen && (
          <MediaPicker
            media={library}
            selectedId={picked?.id ?? null}
            onSelect={(item) => {
              setPicked(item);
              setPreview(null);
              setRemoveImage(false);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
        {product?.image_path && !preview && !picked && (
          <label className="mt-2 flex items-center gap-2 text-sm text-ink-300">
            <input
              type="checkbox"
              name="remove_image"
              checked={removeImage}
              onChange={(e) => setRemoveImage(e.target.checked)}
              className="rounded border-ink-600"
            />
            <X className="size-3.5" aria-hidden /> Remove current photo
          </label>
        )}
        {!product && !preview && !picked && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
            <ImagePlus className="size-3.5" aria-hidden /> No photo yet — you can add one later.
          </p>
        )}
      </div>

      {product && (
        <div className="rounded-xl border border-ink-800 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink-50">Sale</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {product.sale_price !== null
                  ? `On sale at ${currency} ${product.sale_price}.`
                  : "Not on sale."}
              </p>
            </div>
            <ButtonLink href="/admin/sales" variant="outline" size="sm">
              <Tag className="size-4" aria-hidden /> Manage sales
            </ButtonLink>
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm font-medium text-ink-200">
        <input
          type="checkbox"
          name="is_visible"
          defaultChecked={product?.is_visible ?? true}
          className="rounded border-ink-600"
        />
        Visible on public site
      </label>

      <FieldError>{state.error}</FieldError>

      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {product ? "Save changes" : `Create ${itemNoun}`}
        </Button>
        <ButtonLink href="/admin/products" variant="outline">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
