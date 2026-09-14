import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/business";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/auth"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
