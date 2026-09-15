"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VisibilityToggleProps {
  checked: boolean;
  label: string;
  action: (next: boolean) => Promise<{ error?: string } | void>;
}

export function VisibilityToggle({ checked, label, action }: VisibilityToggleProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = !checked;
    startTransition(async () => {
      const result = await action(next);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={isPending}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-accent-solid" : "bg-ink-700",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 transform rounded-full bg-ink-50 shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}
