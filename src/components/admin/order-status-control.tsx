"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ORDER_STATUSES } from "@/lib/orders";
import { updateOrderStatus } from "@/lib/actions/orders";
import { cn } from "@/lib/utils";

/**
 * Moves an order along its lifecycle. Optimistic: the pressed stage lights up
 * immediately, because the shop owner is usually on the phone with the
 * customer while they tap it.
 */
export function OrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function change(next: string) {
    if (next === current) return;
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (result.error) {
        setCurrent(previous);
        toast.error(result.error);
        return;
      }
      toast.success(`Marked as ${ORDER_STATUSES.find((s) => s.value === next)?.label ?? next}.`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ORDER_STATUSES.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={isPending}
          onClick={() => change(option.value)}
          aria-pressed={current === option.value}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
            current === option.value
              ? "border-accent bg-accent/15 text-accent"
              : "border-ink-700 text-ink-300 hover:border-accent/40 hover:text-accent",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
