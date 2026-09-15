import type { OrderStatus } from "@/lib/database.types";

/** One place for how an order's stage is named and coloured. */
export const ORDER_STATUSES: {
  value: OrderStatus;
  label: string;
  /** Tailwind classes for the badge. */
  className: string;
}[] = [
  { value: "new", label: "New", className: "bg-accent/20 text-accent" },
  { value: "confirmed", label: "Confirmed", className: "bg-sky-500/15 text-sky-300" },
  { value: "preparing", label: "Preparing", className: "bg-violet-500/15 text-violet-300" },
  { value: "shipped", label: "Out for delivery", className: "bg-amber-500/15 text-amber-300" },
  { value: "delivered", label: "Delivered", className: "bg-green-500/15 text-green-300" },
  { value: "cancelled", label: "Cancelled", className: "bg-red-500/15 text-red-300" },
];

export function orderStatusMeta(status: string) {
  return (
    ORDER_STATUSES.find((entry) => entry.value === status) ?? {
      value: status as OrderStatus,
      label: status,
      className: "bg-ink-800 text-ink-300",
    }
  );
}

/** "14 Sep, 18:32" — short and unambiguous for someone working a day's orders. */
export function formatOrderDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
