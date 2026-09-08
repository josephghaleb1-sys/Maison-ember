import * as z from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((value) => value === "" || /^https?:\/\/.+/i.test(value), {
    message: "Enter a full URL starting with https://",
  });

export const settingsSchema = z.object({
  business_name: z.string().trim().min(1, "Business name is required.").max(120),
  tagline: z.string().trim().max(160).optional().default(""),
  about_text: z.string().trim().max(4000).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  email: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Enter a valid email address.",
    }),
  address: z.string().trim().max(300).optional().default(""),
  hours_mon: z.string().trim().max(60).optional().default(""),
  hours_tue: z.string().trim().max(60).optional().default(""),
  hours_wed: z.string().trim().max(60).optional().default(""),
  hours_thu: z.string().trim().max(60).optional().default(""),
  hours_fri: z.string().trim().max(60).optional().default(""),
  hours_sat: z.string().trim().max(60).optional().default(""),
  hours_sun: z.string().trim().max(60).optional().default(""),
  social_instagram: optionalUrl,
  social_facebook: optionalUrl,
  social_twitter: optionalUrl,
  social_tiktok: optionalUrl,
  social_yelp: optionalUrl,
});

export type SettingsInput = z.infer<typeof settingsSchema>;
