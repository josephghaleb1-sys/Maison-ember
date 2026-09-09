"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/lib/database.types";
import { Thumb } from "@/components/admin/thumb";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { deleteProduct, setProductVisibility, moveProduct } from "@/lib/actions/products";

export function ProductRow({
  product,
  categoryName,
  isFirst,
  isLast,
  onOptimisticRemove,
}: {
  product: Product;
  categoryName: string | null;
  isFirst: boolean;
  isLast: boolean;
  /** Called synchronously, before the server call, to hide the row immediately. */
  onOptimisticRemove: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveProduct(product.id, direction);
      if (result?.error) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Thumb path={product.image_path} alt={product.name} size={56} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-charcoal-900">{product.name}</p>
          <p className="text-sm text-charcoal-500">
            {formatPrice(product.price)}
            {categoryName && <span className="text-charcoal-400"> · {categoryName}</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
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

        <VisibilityToggle
          checked={product.is_visible}
          label={`Toggle visibility for ${product.name}`}
          action={(next) => setProductVisibility(product.id, next)}
        />

        <Link href={`/admin/products/${product.id}`}>
          <Button variant="outline" size="sm" aria-label="Edit product">
            <Pencil className="size-4" aria-hidden />
          </Button>
        </Link>

        <ConfirmDialog
          trigger={
            <Button variant="outline" size="sm" aria-label="Delete product">
              <Trash2 className="size-4 text-red-600" aria-hidden />
            </Button>
          }
          title="Delete this product?"
          description={`"${product.name}" will be permanently removed, including its photo. This can't be undone.`}
          confirmLabel="Delete"
          action={() => {
            onOptimisticRemove();
            return deleteProduct(product.id);
          }}
          successMessage="Product deleted."
        />
      </div>
    </li>
  );
}
