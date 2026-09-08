"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Pencil, Trash2, Check, X } from "lucide-react";
import type { Category } from "@/lib/database.types";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteCategory,
  moveCategory,
  renameCategory,
  setCategoryVisibility,
} from "@/lib/actions/categories";

export function CategoryRow({
  category,
  productCount,
  isFirst,
  isLast,
}: {
  category: Category;
  productCount: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submitRename() {
    if (name.trim() === category.name) {
      setIsEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await renameCategory(category.id, name);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  }

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveCategory(category.id, direction);
      if (result?.error) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={isFirst || isPending}
            onClick={() => move("up")}
            aria-label="Move up"
            className="flex size-7 items-center justify-center rounded-md text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-700 disabled:opacity-30"
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            disabled={isLast || isPending}
            onClick={() => move("down")}
            aria-label="Move down"
            className="flex size-7 items-center justify-center rounded-md text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-700 disabled:opacity-30"
          >
            <ArrowDown className="size-4" aria-hidden />
          </button>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 w-48"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") {
                  setName(category.name);
                  setIsEditing(false);
                }
              }}
            />
            <Button type="button" size="sm" variant="ghost" onClick={submitRename} disabled={isPending} aria-label="Save">
              <Check className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setName(category.name);
                setIsEditing(false);
              }}
              aria-label="Cancel"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-charcoal-900">{category.name}</p>
            <p className="text-xs text-charcoal-400">
              {productCount} {productCount === 1 ? "product" : "products"}
            </p>
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-2">
          <VisibilityToggle
            checked={category.is_visible}
            label={`Toggle visibility for ${category.name}`}
            action={(next) => setCategoryVisibility(category.id, next)}
          />
          <Button variant="outline" size="sm" aria-label="Rename category" onClick={() => setIsEditing(true)}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" aria-label="Delete category">
                <Trash2 className="size-4 text-red-600" aria-hidden />
              </Button>
            }
            title="Delete this category?"
            description={
              productCount > 0
                ? `"${category.name}" will be removed. ${productCount} ${productCount === 1 ? "product" : "products"} will become uncategorized — none will be deleted.`
                : `"${category.name}" will be permanently removed.`
            }
            confirmLabel="Delete"
            action={() => deleteCategory(category.id)}
            successMessage="Category deleted."
          />
        </div>
      )}
    </li>
  );
}
