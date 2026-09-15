import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireBusinessContext } from "@/lib/dal";
import { getOrders, getOrderStatusCounts } from "@/lib/queries/admin";
import { ORDER_STATUSES, formatOrderDate, orderStatusMeta } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage(props: PageProps<"/admin/orders">) {
  const searchParams = await props.searchParams;
  const status = typeof searchParams.status === "string" ? searchParams.status : "all";

  const { business } = await requireBusinessContext();
  const [orders, counts] = await Promise.all([
    getOrders(business.id, status),
    getOrderStatusCounts(business.id),
  ]);

  const filters = [{ value: "all", label: "All" }, ...ORDER_STATUSES];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-50">Orders</h1>
        <p className="text-sm text-ink-400">
          {counts.new ? `${counts.new} waiting to be confirmed` : "Nothing waiting — you're all caught up."}
        </p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {filters.map((filter) => {
          const active = status === filter.value;
          const count = counts[filter.value] ?? 0;
          return (
            <Link
              key={filter.value}
              href={filter.value === "all" ? "/admin/orders" : `/admin/orders?status=${filter.value}`}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-ink-700 text-ink-300 hover:border-accent/40 hover:text-accent",
              )}
            >
              {filter.label}
              {count > 0 && <span className="ml-1.5 text-ink-500">{count}</span>}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardBody>
          {orders.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={status === "all" ? "No orders yet" : "Nothing in this stage"}
              description={
                status === "all"
                  ? "When a customer checks out, their order lands here with their phone number and address."
                  : "Try another filter to see the rest of your orders."
              }
            />
          ) : (
            <ul className="divide-y divide-ink-800">
              {orders.map((order) => {
                const meta = orderStatusMeta(order.status);
                return (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="-mx-2 flex flex-col gap-2 rounded-lg px-2 py-4 transition-colors hover:bg-ink-800/50 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="flex items-center gap-3 sm:w-40 sm:shrink-0">
                        <span className="font-mono text-sm text-accent">#{order.order_number}</span>
                        <span className="text-xs text-ink-500">
                          {formatOrderDate(order.created_at)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-50">
                          {order.customer_name}
                        </p>
                        <p className="truncate text-xs text-ink-400">
                          {order.customer_phone}
                          {order.delivery_zone_name && ` · ${order.delivery_zone_name}`}
                          {order.city && `, ${order.city}`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            meta.className,
                          )}
                        >
                          {meta.label}
                        </span>
                        <span className="text-sm font-medium text-ink-50">
                          {formatPrice(order.total, order.currency)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
