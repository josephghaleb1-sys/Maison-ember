import * as z from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  is_visible: z.coerce.boolean().optional().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
