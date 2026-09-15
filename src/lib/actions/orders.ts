"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicBusiness } from "@/lib/business";
import { requireBusinessContext } from "@/lib/dal";
import { checkoutSchema, cartItemsSchema } from "@/lib/validation/order";
import type { FormState } from "@/lib/actions/auth";
import type { OrderStatus } from "@/lib/database.types";

/**
 * Places a cash-on-delivery order.
 *
 * The action validates the shape of the request, then hands it to the
 * `place_order` database function. That function — not this code — decides
 * what the order costs: it re-reads every product price and the delivery fee
 * from the tables. The browser only ever says *which* products and *how many*.
 */
export async function placeOrder(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  // A filled honeypot means a bot: accept silently so it learns nothing.
  if (parsed.data.website) {
    return { error: "Something went wrong. Please try again." };
  }

  let items: { product_id: string; quantity: number }[];
  try {
    items = cartItemsSchema.parse(JSON.parse(String(formData.get("items") ?? "[]")));
  } catch {
    return { error: "Your cart is empty or out of date. Please review it and try again." };
  }

  const business = await getPublicBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("place_order", {
    p_business_slug: business.slug,
    p_customer_name: parsed.data.customer_name,
    p_customer_phone: parsed.data.customer_phone,
    p_address_line: parsed.data.address_line,
    p_items: items,
    p_delivery_zone_id: parsed.data.delivery_zone_id,
    p_city: parsed.data.city,
    p_address_details: parsed.data.address_details,
    p_notes: parsed.data.notes,
    p_customer_email: parsed.data.customer_email,
  });

  if (error) {
    // The function raises friendly, customer-facing messages for the cases it
    // rejects (closed shop, empty cart, unavailable item, minimum order).
    return { error: error.message || "We couldn't place your order. Please try again." };
  }

  const token = data?.public_token;
  if (!token) {
    return { error: "We couldn't place your order. Please try again." };
  }

  revalidatePath("/admin/orders");
  redirect(`/order/${token}`);
}

/** Dashboard: move an order along its lifecycle. */
const STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  if (!STATUSES.includes(status as OrderStatus)) {
    return { error: "Unknown order status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: status as OrderStatus })
    .eq("id", orderId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't update the order: ${error.message}` };

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return {};
}

export async function updateOrderNote(
  orderId: string,
  note: string,
): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ admin_note: note.trim().slice(0, 1000) })
    .eq("id", orderId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't save the note: ${error.message}` };

  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}

export async function deleteOrder(orderId: string): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't delete the order: ${error.message}` };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return {};
}
