"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCategory } from "@/lib/actions/categories";

export function NewCategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createCategory(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2">
      <Input name="name" placeholder="New category name" required maxLength={80} className="max-w-xs" />
      <Button type="submit" size="md" loading={isPending}>
        <Plus className="size-4" aria-hidden />
        <span className="hidden sm:inline">Add</span>
      </Button>
    </form>
  );
}
