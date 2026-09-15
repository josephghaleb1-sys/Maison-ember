"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Tag, X } from "lucide-react";
import type { Product } from "@/lib/database.types";
import {
  endAllSales,
  endProductSale,
  setProductSale,
  startBulkSale,
} from "@/lib/actions/sales";
import { priceView, saleEndsLabel } from "@/lib/pricing";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Thumb } from "@/components/admin/thumb";

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function SaleRow({
  product,
  currency,
  selected,
  onSelect,
}: {
  product: Product;
  currency: string;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  const view = priceView(product);
  const [price, setPrice] = useState(product.sale_price === null ? "" : String(product.sale_price));
  const [endsAt, setEndsAt] = useState(toLocalInput(product.sale_ends_at));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const dirty =
    price !== (product.sale_price === null ? "" : String(product.sale_price)) ||
    endsAt !== toLocalInput(product.sale_ends_at);

  function save() {
    startTransition(async () => {
      const result = await setProductSale(product.id, {
        sale_price: price,
        sale_ends_at: endsAt ? new Date(endsAt).toISOString() : "",
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(price ? `${product.name} is on sale.` : `Sale ended for ${product.name}.`);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onSelect(event.target.checked)}
          aria-label={`Select ${product.name}`}
          className="rounded border-ink-600"
        />
        <Thumb path={product.image_path} alt={product.name} size={44} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-50">{product.name}</p>
          <p className="text-xs text-ink-400">
            {view.onSale ? (
              <>
                <span className="line-through">{formatPrice(product.price, currency)}</span>{" "}
                <span className="font-medium text-accent">
                  {formatPrice(view.current, currency)}
                </span>
                <span className="ml-1.5 text-ink-500">−{view.discountPercent}%</span>
                {saleEndsLabel(product.sale_ends_at) && (
                  <span className="ml-1.5 text-ink-500">· {saleEndsLabel(product.sale_ends_at)}</span>
                )}
              </>
            ) : (
              formatPrice(product.price, currency)
            )}
            {!product.is_visible && <span className="ml-1.5 text-amber-400">· hidden</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-28">
          <Label htmlFor={`sale-${product.id}`} className="text-xs">
            Sale price
          </Label>
          <Input
            id={`sale-${product.id}`}
            type="number"
            min="0"
            step="0.5"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="—"
            className="h-9"
          />
        </div>
        <div className="w-48">
          <Label htmlFor={`ends-${product.id}`} className="text-xs">
            Ends (optional)
          </Label>
          <Input
            id={`ends-${product.id}`}
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            className="h-9"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant={dirty ? "primary" : "outline"}
          onClick={save}
          loading={isPending}
          disabled={!dirty}
          aria-label={`Save sale for ${product.name}`}
        >
          <Check className="size-4" aria-hidden /> Save
        </Button>
        {view.onSale && (
          <ConfirmDialog
            title="End this sale?"
            description={`${product.name} goes back to ${formatPrice(product.price, currency)}.`}
            confirmLabel="End sale"
            successMessage="Sale ended."
            danger={false}
            action={() => endProductSale(product.id)}
            trigger={
              <Button type="button" variant="outline" size="sm" aria-label={`End sale for ${product.name}`}>
                <X className="size-4" aria-hidden />
              </Button>
            }
          />
        )}
      </div>
    </li>
  );
}

export function SaleManager({
  products,
  currency,
  itemNounPlural,
}: {
  products: Product[];
  currency: string;
  itemNounPlural: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [percent, setPercent] = useState("20");
  const [endsAt, setEndsAt] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onSale = useMemo(() => products.filter((p) => priceView(p).onSale), [products]);

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    );
  }

  function applyBulk() {
    startTransition(async () => {
      const result = await startBulkSale(
        selected,
        Number(percent),
        endsAt ? new Date(endsAt).toISOString() : "",
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.updated} ${result.updated === 1 ? "item is" : "items are"} on sale.`);
      setSelected([]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm text-ink-400">On sale now</p>
            <p className="mt-1 font-display text-2xl text-accent">{onSale.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-ink-400">Total {itemNounPlural}</p>
            <p className="mt-1 font-display text-2xl text-ink-50">{products.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink-400">Everything back to normal</p>
              <p className="mt-1 text-xs text-ink-500">Ends every running sale.</p>
            </div>
            {onSale.length > 0 && (
              <ConfirmDialog
                title="End every sale?"
                description={`All ${onSale.length} discounted ${onSale.length === 1 ? "item goes" : "items go"} back to their normal prices.`}
                confirmLabel="End all sales"
                successMessage="All sales ended."
                action={() => endAllSales()}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    End all
                  </Button>
                }
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Bulk discount — how a shop usually runs a sale. */}
      <Card>
        <CardHeader>
          <CardTitle>Put several items on sale</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-28">
              <Label htmlFor="percent">Discount</Label>
              <div className="relative">
                <Input
                  id="percent"
                  type="number"
                  min="1"
                  max="90"
                  value={percent}
                  onChange={(event) => setPercent(event.target.value)}
                  className="pr-7"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">
                  %
                </span>
              </div>
            </div>
            <div className="w-56">
              <Label htmlFor="bulk-ends">Ends (optional)</Label>
              <Input
                id="bulk-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={applyBulk}
              loading={isPending}
              disabled={selected.length === 0}
            >
              <Tag className="size-4" aria-hidden />
              Apply to {selected.length || "selected"}
              {selected.length === 1 ? " item" : selected.length > 1 ? " items" : ""}
            </Button>
            {selected.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])}>
                Clear selection
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Tick the items below, choose a percentage, and each sale price is worked out from that
            item&apos;s own price.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Every {itemNounPlural.replace(/s$/, "")}</CardTitle>
          {products.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setSelected(selected.length === products.length ? [] : products.map((p) => p.id))
              }
              className="text-xs font-medium uppercase tracking-[0.14em] text-accent hover:underline"
            >
              {selected.length === products.length ? "Deselect all" : "Select all"}
            </button>
          )}
        </CardHeader>
        <CardBody>
          {products.length === 0 ? (
            <EmptyState
              icon={Tag}
              title={`No ${itemNounPlural} yet`}
              description="Add something to your catalogue first, then you can put it on sale here."
            />
          ) : (
            <ul className={cn("divide-y divide-ink-800")}>
              {products.map((product) => (
                <SaleRow
                  key={product.id}
                  product={product}
                  currency={currency}
                  selected={selected.includes(product.id)}
                  onSelect={(checked) => toggle(product.id, checked)}
                />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
