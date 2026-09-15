import * as z from "zod";

/**
 * Checkout form rules.
 *
 * Phone: Lebanese numbers are 7-8 digits after the country code and people
 * write them every which way (03 123 456, +961 3 123 456, 70-123-456), so we
 * normalise to digits and check the length rather than forcing a format.
 */
const phone = z
  .string()
  .trim()
  .min(6, "Enter your phone number.")
  .max(40)
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }, "Enter a valid phone number, e.g. 70 123 456.");

export const checkoutSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120),
  customer_phone: phone,
  customer_phone_alt: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default("")
    .refine(
      (value) => value === "" || value.replace(/\D/g, "").length >= 7,
      "Enter a valid second number, or leave it empty.",
    ),
  customer_email: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Enter a valid email address, or leave it empty.",
    ),
  delivery_zone_id: z.string().uuid("Choose your delivery area."),
  city: z.string().trim().min(2, "Enter your city or town.").max(120),
  address_line: z
    .string()
    .trim()
    .min(3, "Enter your street, building and floor.")
    .max(300),
  address_details: z.string().trim().max(300).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  /** Honeypot: a real person never fills a hidden field. */
  website: z.string().max(0).optional().default(""),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartItemsSchema = z
  .array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.coerce.number().int().min(1).max(99),
    }),
  )
  .min(1, "Your cart is empty.")
  .max(50, "That is too many different items for one order.");
