import type { MetadataRoute } from "next";
import { getSiteContext, getSiteUrl } from "@/lib/business";

/**
 * Per-business sitemap: the catalogue path depends on the industry, so it is
 * resolved rather than hard-coded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ preset }, siteUrl] = await Promise.all([getSiteContext(), getSiteUrl()]);
  const lastModified = new Date();

  return [
    { url: siteUrl, lastModified, priority: 1 },
    { url: `${siteUrl}${preset.catalogPath}`, lastModified, priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified, priority: 0.6 },
    { url: `${siteUrl}/gallery`, lastModified, priority: 0.6 },
    { url: `${siteUrl}/contact`, lastModified, priority: 0.7 },
  ];
}
