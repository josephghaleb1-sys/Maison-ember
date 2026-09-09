"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ImagePlus, X } from "lucide-react";
import type { Category, Product } from "@/lib/database.types";
import type { FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { Thumb } from "@/components/admin/thumb";
import { compressImageFile } from "@/lib/image-compress";

const initialState: FormState = {};

export function ProductForm({
  product,
  categories,
  action,
}: {
  product?: Product;
  categories: Category[];
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

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
          <Label htmlFor="price">Price (USD)</Label>
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
            !removeImage && <Thumb path={product?.image_path ?? null} alt={product?.name ?? "Product"} size={64} />
          )}
          <div className="flex-1">
            <input
              id="image"
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="block w-full text-sm text-charcoal-300 file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-charcoal-200 hover:file:bg-charcoal-700"
              onChange={async (e) => {
                const input = e.target;
                const file = input.files?.[0];
                setRemoveImage(false);
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
                if (compressed !== file) {
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(compressed);
                  input.files = dataTransfer.files;
                }
              }}
            />
            <p className="mt-1 text-xs text-charcoal-500">
              {isCompressing ? "Optimizing photo…" : "JPG, PNG, WebP, GIF, or SVG. Max 5MB."}
            </p>
          </div>
        </div>
        {product?.image_path && !preview && (
          <label className="mt-2 flex items-center gap-2 text-sm text-charcoal-300">
            <input
              type="checkbox"
              name="remove_image"
              checked={removeImage}
              onChange={(e) => setRemoveImage(e.target.checked)}
              className="rounded border-charcoal-600"
            />
            <X className="size-3.5" aria-hidden /> Remove current photo
          </label>
        )}
        {!product && !preview && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-charcoal-500">
            <ImagePlus className="size-3.5" aria-hidden /> No photo selected yet — that&apos;s okay, you can add one later.
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-charcoal-200">
        <input
          type="checkbox"
          name="is_visible"
          defaultChecked={product?.is_visible ?? true}
          className="rounded border-charcoal-600"
        />
        Visible on public site
      </label>

      <FieldError>{state.error}</FieldError>

      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {product ? "Save changes" : "Create product"}
        </Button>
        <Link href="/admin/products">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
