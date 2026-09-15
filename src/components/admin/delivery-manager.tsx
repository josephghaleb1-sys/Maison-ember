"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type { DeliveryZone, WebsiteSettings } from "@/lib/database.types";
import type { FormState } from "@/lib/actions/auth";
import {
  createDeliveryZone,
  deleteDeliveryZone,
  setDeliveryZoneActive,
  updateCheckoutSettings,
  updateDeliveryZone,
} from "@/lib/actions/delivery";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { Truck } from "lucide-react";
import { formatPrice, toNumber } from "@/lib/utils";

const initialState: FormState = {};

function ZoneRow({ zone, currency }: { zone: DeliveryZone; currency: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(zone.name);
  const [fee, setFee] = useState(String(zone.fee));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    startTransition(async () => {
      const result = await updateDeliveryZone(zone.id, { name, fee: Number(fee) });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setIsEditing(false);
      toast.success("Area updated.");
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      {isEditing ? (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-9 w-44"
            aria-label="Area name"
            autoFocus
          />
          <Input
            value={fee}
            onChange={(event) => setFee(event.target.value)}
            type="number"
            min="0"
            step="0.5"
            className="h-9 w-28"
            aria-label="Delivery fee"
          />
          <Button type="button" size="sm" variant="ghost" onClick={save} loading={isPending} aria-label="Save area">
            <Check className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Cancel"
            onClick={() => {
              setName(zone.name);
              setFee(String(zone.fee));
              setIsEditing(false);
            }}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-ink-50">{zone.name}</p>
          <p className="text-xs text-ink-500">
            {toNumber(zone.fee) > 0
              ? `${formatPrice(zone.fee, currency)} delivery`
              : "Free delivery"}
          </p>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <VisibilityToggle
          checked={zone.is_active}
          label={`Offer delivery to ${zone.name}`}
          action={(next) => setDeliveryZoneActive(zone.id, next)}
        />
        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Edit ${zone.name}`}
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
        )}
        <ConfirmDialog
          title="Remove this area?"
          description={`Customers won't be able to choose ${zone.name} at checkout. Past orders keep the area and fee they were charged.`}
          confirmLabel="Remove"
          successMessage="Area removed."
          action={() => deleteDeliveryZone(zone.id)}
          trigger={
            <Button variant="outline" size="sm" aria-label={`Remove ${zone.name}`}>
              <Trash2 className="size-4 text-red-400" aria-hidden />
            </Button>
          }
        />
      </div>
    </li>
  );
}

export function DeliveryManager({
  zones,
  settings,
}: {
  zones: DeliveryZone[];
  settings: WebsiteSettings | null;
}) {
  const [state, formAction, isPending] = useActionState(updateCheckoutSettings, initialState);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [isAdding, startAdding] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const currency = settings?.currency || "USD";

  useEffect(() => {
    if (state.message) toast.success(state.message);
  }, [state]);

  function addZone(formData: FormData) {
    setZoneError(null);
    startAdding(async () => {
      const result = await createDeliveryZone(formData);
      if (result.error) {
        setZoneError(result.error);
        return;
      }
      formRef.current?.reset();
      toast.success("Area added.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Delivery areas</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          {zones.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No delivery areas yet"
              description="Add the areas you deliver to and what each one costs — customers pick theirs at checkout."
            />
          ) : (
            <ul className="divide-y divide-ink-800">
              {zones.map((zone) => (
                <ZoneRow key={zone.id} zone={zone} currency={currency} />
              ))}
            </ul>
          )}

          <form ref={formRef} action={addZone} className="border-t border-ink-800 pt-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-44 flex-1">
                <Label htmlFor="zone_name">Area</Label>
                <Input id="zone_name" name="name" placeholder="e.g. Mount Lebanon" required maxLength={80} />
              </div>
              <div className="w-32">
                <Label htmlFor="zone_fee">Fee ({currency})</Label>
                <Input id="zone_fee" name="fee" type="number" min="0" step="0.5" defaultValue="0" required />
              </div>
              <Button type="submit" size="md" loading={isAdding}>
                <Plus className="size-4" aria-hidden /> Add
              </Button>
            </div>
            <FieldError>{zoneError}</FieldError>
          </form>
        </CardBody>
      </Card>

      <form action={formAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <label className="flex items-start gap-3 text-sm text-ink-200">
              <input
                type="checkbox"
                name="checkout_enabled"
                defaultChecked={settings?.checkout_enabled ?? true}
                className="mt-0.5 rounded border-ink-600"
              />
              <span>
                <span className="font-medium">Accept orders on the website</span>
                <span className="mt-0.5 block text-xs text-ink-500">
                  Turn this off to hide the cart and checkout — the site then points customers to
                  WhatsApp instead.
                </span>
              </span>
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="free_delivery_over">Free delivery over ({currency})</Label>
                <Input
                  id="free_delivery_over"
                  name="free_delivery_over"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Leave empty for none"
                  defaultValue={settings?.free_delivery_over ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="min_order_total">Minimum order ({currency})</Label>
                <Input
                  id="min_order_total"
                  name="min_order_total"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={settings?.min_order_total ?? 0}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="order_notice">Note shown at checkout</Label>
              <Textarea
                id="order_notice"
                name="order_notice"
                rows={3}
                maxLength={500}
                defaultValue={settings?.order_notice}
                placeholder="e.g. Cash on delivery all over Lebanon. We call to confirm every order."
              />
            </div>
          </CardBody>
        </Card>

        <FieldError>{state.error}</FieldError>

        <div className="sticky bottom-16 flex flex-wrap items-center gap-3 rounded-xl border border-ink-800 bg-ink-900/95 p-4 backdrop-blur md:bottom-0">
          <Button type="submit" loading={isPending}>
            Save delivery settings
          </Button>
        </div>
      </form>
    </div>
  );
}
