import * as z from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  description: z.string().trim().max(2000).optional().default(""),
  price: z.coerce.number({ error: "Enter a valid price." }).min(0, "Price can't be negative."),
  category_id: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
  is_visible: z.coerce.boolean().optional().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
