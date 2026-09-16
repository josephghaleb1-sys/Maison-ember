import * as z from "zod";
import { BUSINESS_TYPES } from "@/lib/business-types";
import type { BusinessType } from "@/lib/database.types";

const businessTypeValues = Object.keys(BUSINESS_TYPES) as [BusinessType, ...BusinessType[]];

export const businessSettingsSchema = z.object({
  business_type: z.enum(businessTypeValues, { error: "Choose a business type." }),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code, e.g. USD."),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;

/**
 * Hostname for a custom domain.
 *
 * Deliberately strict: the value is matched against the request's Host header
 * to decide whose website to serve, so anything ambiguous (a scheme, a port,
 * a path, uppercase) is rejected rather than silently normalized into
 * something the owner didn't intend to map.
 */
export const domainSchema = z.object({
  hostname: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Enter a domain, e.g. example.com.")
    .max(253)
    .refine((value) => !/^https?:\/\//i.test(value), {
      message: "Enter the domain only, without https://",
    })
    .refine((value) => !value.includes("/"), { message: "Enter the domain only, without a path." })
    .refine((value) => !value.includes(":"), { message: "Enter the domain only, without a port." })
    .refine((value) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(value), {
      message: "That doesn't look like a valid domain.",
    }),
});

export type DomainInput = z.infer<typeof domainSchema>;
