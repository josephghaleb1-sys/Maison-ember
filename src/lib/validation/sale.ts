import * as z from "zod";

/**
 * A sale is a lower price, optionally with an end date. Both are validated
 * here and again by the database's CHECK constraint — a "sale" that isn't
 * cheaper than the normal price is not a sale.
 */
export const saleSchema = z
  .object({
    sale_price: z
      .string()
      .trim()
      .optional()
      .default("")
      .transform((value) => (value === "" ? null : Number(value)))
      .refine(
        (value) => value === null || (Number.isFinite(value) && value >= 0),
        "Enter a sale price, or leave it empty to end the sale.",
      ),
    sale_ends_at: z
      .string()
      .trim()
      .optional()
      .default("")
      .transform((value) => (value === "" ? null : value))
      .refine(
        (value) => value === null || !Number.isNaN(new Date(value).getTime()),
        "That end date isn't valid.",
      ),
    price: z.coerce.number().min(0),
  })
  .refine((data) => data.sale_price === null || data.sale_price < data.price, {
    message: "The sale price has to be lower than the normal price.",
    path: ["sale_price"],
  });

export type SaleInput = z.infer<typeof saleSchema>;
