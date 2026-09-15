import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, Trash2 } from "lucide-react";
import { requireBusinessContext } from "@/lib/dal";
import { getOrder } from "@/lib/queries/admin";
import { deleteOrder } from "@/lib/actions/orders";
import { formatOrderDate, orderStatusMeta } from "@/lib/orders";
import { whatsappHref } from "@/lib/contact";
import { formatPrice, toNumber, cn } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { OrderNoteForm } from "@/components/admin/order-note-form";
import { WhatsAppIcon } from "@/components/site/social-icons";

export const metadata: Metadata = { title: "Order" };

export default async function OrderDetailPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const { business } = await requireBusinessContext();
  const result = await getOrder(business.id, id);
  if (!result) notFound();

  const { order, items } = result;
  const meta = orderStatusMeta(order.status);
  const whatsapp = whatsappHref(
    order.customer_phone,
    `Hi ${order.customer_name}, about your order #${order.order_number} —`,
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-ink-400 transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All orders
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink-50">
            Order #{order.order_number}
          </h1>
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", meta.className)}>
            {meta.label}
          </span>
          <span className="text-sm text-ink-500">{formatOrderDate(order.created_at)}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stage</CardTitle>
        </CardHeader>
        <CardBody>
          <OrderStatusControl orderId={order.id} status={order.status} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <p className="text-base font-medium text-ink-50">{order.customer_name}</p>
            <p className="flex items-center gap-2 text-ink-300">
              <Phone className="size-4 shrink-0 text-accent/70" aria-hidden />
              <a href={`tel:${order.customer_phone}`} className="hover:text-accent">
                {order.customer_phone}
              </a>
            </p>
            {order.customer_phone_alt && (
              <p className="flex items-center gap-2 text-ink-300">
                <Phone className="size-4 shrink-0 text-ink-600" aria-hidden />
                <a href={`tel:${order.customer_phone_alt}`} className="hover:text-accent">
                  {order.customer_phone_alt}
                </a>
              </p>
            )}
            {order.customer_email && (
              <p className="flex items-center gap-2 break-all text-ink-300">
                <Mail className="size-4 shrink-0 text-accent/70" aria-hidden />
                <a href={`mailto:${order.customer_email}`} className="hover:text-accent">
                  {order.customer_email}
                </a>
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={`tel:${order.customer_phone}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 px-3 py-1.5 text-xs font-medium text-ink-200 transition-colors hover:border-accent/50 hover:text-accent"
              >
                <Phone className="size-3.5" aria-hidden /> Call
              </a>
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 px-3 py-1.5 text-xs font-medium text-ink-200 transition-colors hover:border-accent/50 hover:text-accent"
                >
                  <WhatsAppIcon className="size-3.5" /> WhatsApp
                </a>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deliver to</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm text-ink-300">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent/70" aria-hidden />
              <span>
                {order.address_line}
                {order.address_details && <>, {order.address_details}</>}
                <br />
                {[order.city, order.delivery_zone_name].filter(Boolean).join(", ")}
              </span>
            </p>
            {order.notes && (
              <p className="rounded-lg border border-ink-800 bg-ink-950/60 p-3 text-ink-200">
                <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-ink-500">
                  Customer note
                </span>
                {order.notes}
              </p>
            )}
            <p className="text-xs uppercase tracking-[0.14em] text-ink-500">
              Payment: cash on delivery
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-ink-800">
            {items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 py-3">
                <span className="min-w-0 text-sm text-ink-100">
                  {item.name}
                  <span className="text-ink-500"> × {item.quantity}</span>
                  <span className="ml-2 text-xs text-ink-500">
                    @ {formatPrice(item.unit_price, order.currency)}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-ink-200">
                  {formatPrice(item.line_total, order.currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-ink-800 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-400">Subtotal</dt>
              <dd className="text-ink-100">{formatPrice(order.subtotal, order.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">Delivery</dt>
              <dd className="text-ink-100">
                {toNumber(order.delivery_fee) === 0
                  ? "Free"
                  : formatPrice(order.delivery_fee, order.currency)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink-800 pt-3">
              <dt className="uppercase tracking-[0.14em] text-ink-300">To collect</dt>
              <dd className="font-display text-2xl text-accent">
                {formatPrice(order.total, order.currency)}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <OrderNoteForm orderId={order.id} note={order.admin_note} />
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <ConfirmDialog
          title="Delete this order?"
          description={`Order #${order.order_number} and its items will be permanently removed. Consider marking it cancelled instead — that keeps the record.`}
          confirmLabel="Delete order"
          successMessage="Order deleted."
          action={async () => {
            "use server";
            const result = await deleteOrder(id);
            if (result.error) return result;
            // This page no longer exists — go back to the list.
            redirect("/admin/orders");
          }}
          trigger={
            <Button variant="outline" size="sm">
              <Trash2 className="size-4 text-red-400" aria-hidden /> Delete order
            </Button>
          }
        />
      </div>
    </div>
  );
}
