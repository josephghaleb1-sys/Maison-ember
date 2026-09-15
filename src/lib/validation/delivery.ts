import * as z from "zod";

export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(1, "Name the area, e.g. Beirut.").max(80),
  fee: z.coerce
    .number({ error: "Enter a delivery fee." })
    .min(0, "A fee can't be negative.")
    .max(100000),
});

export const checkoutSettingsSchema = z.object({
  checkout_enabled: z.coerce.boolean().optional().default(false),
  free_delivery_over: z
    .string()
    .trim()
    .optional()
    .default("")
    .transform((value) => (value === "" ? null : Number(value)))
    .refine(
      (value) => value === null || (Number.isFinite(value) && value >= 0),
      "Enter an amount, or leave it empty for no free-delivery threshold.",
    ),
  min_order_total: z.coerce
    .number({ error: "Enter a minimum order amount." })
    .min(0, "A minimum can't be negative.")
    .optional()
    .default(0),
  order_notice: z.string().trim().max(500).optional().default(""),
  whish_enabled: z.coerce.boolean().optional().default(false),
  whish_number: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default("")
    .refine(
      (value) => value === "" || value.replace(/\D/g, "").length >= 7,
      "Enter the Whish number people should send to.",
    ),
  whish_note: z.string().trim().max(300).optional().default(""),
})
  .refine((data) => !data.whish_enabled || data.whish_number !== "", {
    message: "Add your Whish number before turning Whish payments on.",
    path: ["whish_number"],
  });

export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>;
export type CheckoutSettingsInput = z.infer<typeof checkoutSettingsSchema>;
