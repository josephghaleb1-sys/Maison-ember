import * as z from "zod";

/** Matches the CHECK constraints on website_settings.primary_color /
 * secondary_color. These values are interpolated into a <style> tag on the
 * public site, so the format is enforced here as well as in the database. */
const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Enter a 6-digit hex color, e.g. #C8A44D.");

export const websiteSchema = z.object({
  primary_color: hexColor,
  secondary_color: hexColor,
  hero_title: z.string().trim().max(120).optional().default(""),
  hero_subtitle: z.string().trim().max(280).optional().default(""),
  // Search engines truncate well before these limits; they're a guardrail
  // against pasting an entire page in, not a style rule.
  seo_title: z.string().trim().max(160).optional().default(""),
  seo_description: z.string().trim().max(320).optional().default(""),
});

export type WebsiteInput = z.infer<typeof websiteSchema>;
