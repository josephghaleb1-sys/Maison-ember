import * as z from "zod";

export const testimonialSchema = z.object({
  author_name: z.string().trim().min(1, "Who said it?").max(80),
  author_role: z.string().trim().max(80).optional().default(""),
  quote: z.string().trim().min(1, "Add the review text.").max(600),
  rating: z.coerce
    .number({ error: "Pick a rating." })
    .int()
    .min(1, "Rating must be 1-5.")
    .max(5, "Rating must be 1-5.")
    .optional()
    .default(5),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;
