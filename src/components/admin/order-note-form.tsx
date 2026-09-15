"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOrderNote } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";

/** Internal note on an order — never shown to the customer. */
export function OrderNoteForm({ orderId, note }: { orderId: string; note: string }) {
  const [value, setValue] = useState(note);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateOrderNote(orderId, value);
      if (result.error) toast.error(result.error);
      else toast.success("Note saved.");
    });
  }

  return (
    <div>
      <Label htmlFor="admin_note">Internal note</Label>
      <Textarea
        id="admin_note"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Only your team sees this — e.g. “called, delivering Thursday”."
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3"
        loading={isPending}
        onClick={save}
        disabled={value === note}
      >
        Save note
      </Button>
    </div>
  );
}
