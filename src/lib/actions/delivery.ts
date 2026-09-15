"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { checkoutSettingsSchema, deliveryZoneSchema } from "@/lib/validation/delivery";
import type { FormState } from "@/lib/actions/auth";

function revalidateCheckout() {
  revalidatePath("/admin/delivery");
  revalidatePath("/checkout");
  revalidatePath("/", "layout");
}

export async function createDeliveryZone(formData: FormData): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();

  const parsed = deliveryZoneSchema.safeParse({
    name: formData.get("name"),
    fee: formData.get("fee"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("delivery_zones")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  const { error } = await supabase.from("delivery_zones").insert({
    business_id: business.id,
    name: parsed.data.name,
    fee: parsed.data.fee,
    sort_order: count ?? 0,
  });

  if (error) {
    if (error.code === "23505") return { error: "You already have an area with that name." };
    return { error: `Couldn't add the area: ${error.message}` };
  }

  revalidateCheckout();
  return {};
}

export async function updateDeliveryZone(
  zoneId: string,
  values: { name: string; fee: number },
): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();

  const parsed = deliveryZoneSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the values." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_zones")
    .update({ name: parsed.data.name, fee: parsed.data.fee })
    .eq("id", zoneId)
    .eq("business_id", business.id);

  if (error) {
    if (error.code === "23505") return { error: "You already have an area with that name." };
    return { error: `Couldn't save the area: ${error.message}` };
  }

  revalidateCheckout();
  return {};
}

export async function setDeliveryZoneActive(
  zoneId: string,
  isActive: boolean,
): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_zones")
    .update({ is_active: isActive })
    .eq("id", zoneId)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidateCheckout();
  return {};
}

/**
 * Removing an area never touches past orders: they store a snapshot of the
 * area name and the fee that was charged.
 */
export async function deleteDeliveryZone(zoneId: string): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_zones")
    .delete()
    .eq("id", zoneId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't remove the area: ${error.message}` };

  revalidateCheckout();
  return {};
}

export async function updateCheckoutSettings(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { business } = await requireBusinessContext();

  const parsed = checkoutSettingsSchema.safeParse({
    checkout_enabled: formData.get("checkout_enabled") === "on",
    free_delivery_over: formData.get("free_delivery_over"),
    min_order_total: formData.get("min_order_total") || 0,
    order_notice: formData.get("order_notice"),
    whish_enabled: formData.get("whish_enabled") === "on",
    whish_number: formData.get("whish_number"),
    whish_note: formData.get("whish_note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("website_settings")
    .select("business_name")
    .eq("business_id", business.id)
    .maybeSingle();

  const { error } = await supabase.from("website_settings").upsert(
    {
      business_id: business.id,
      business_name: existing?.business_name || business.name,
      checkout_enabled: parsed.data.checkout_enabled,
      free_delivery_over: parsed.data.free_delivery_over,
      min_order_total: parsed.data.min_order_total,
      order_notice: parsed.data.order_notice,
      whish_enabled: parsed.data.whish_enabled,
      whish_number: parsed.data.whish_number,
      whish_note: parsed.data.whish_note,
    },
    { onConflict: "business_id" },
  );

  if (error) return { error: `Couldn't save: ${error.message}` };

  revalidateCheckout();
  return { message: "Delivery settings saved." };
}
