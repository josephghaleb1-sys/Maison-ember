import * as z from "zod";
import type { Industry } from "@/lib/database.types";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((value) => value === "" || /^https?:\/\/.+/i.test(value), {
    message: "Enter a full URL starting with https://",
  });

const INDUSTRIES: Industry[] = [
  "restaurant",
  "cafe",
  "beauty",
  "barbershop",
  "salon",
  "gym",
  "retail",
  "other",
];

/** Everything on Dashboard -> Business info. */
export const businessInfoSchema = z.object({
  business_name: z.string().trim().min(1, "Business name is required.").max(120),
  industry: z.enum(INDUSTRIES as [Industry, ...Industry[]]).optional().default("other"),
  tagline: z.string().trim().max(160).optional().default(""),
  about_text: z.string().trim().max(4000).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  whatsapp: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default("")
    .refine((value) => value === "" || /^[+\d][\d\s()-]{5,}$/.test(value), {
      message: "Enter a phone number, digits only (you can include +, spaces or dashes).",
    }),
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

export type BusinessInfoInput = z.infer<typeof businessInfoSchema>;

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour in #rrggbb form.");

/** Everything on Dashboard -> Website (branding, hero copy, SEO). */
export const websiteSettingsSchema = z.object({
  hero_title: z.string().trim().max(120).optional().default(""),
  hero_subtitle: z.string().trim().max(300).optional().default(""),
  hero_cta_label: z.string().trim().max(40).optional().default(""),
  primary_color: hexColor,
  secondary_color: hexColor,
  seo_title: z.string().trim().max(70).optional().default(""),
  seo_description: z.string().trim().max(200).optional().default(""),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code, e.g. USD.")
    .optional()
    .default("USD"),
  show_prices: z.coerce.boolean().optional().default(false),
});

export type WebsiteSettingsInput = z.infer<typeof websiteSettingsSchema>;

/** A bare hostname: no protocol, no path, no port. */
export const hostnameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Enter a hostname, e.g. mybusiness.com")
  .max(253)
  .regex(
    /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/,
    "Enter a bare hostname like mybusiness.com — no https:// and no trailing slash.",
  );
