import type { Metadata } from "next";
import { getSiteContext } from "@/lib/business";
import { buildThemeCss } from "@/lib/theme";
import { getPublicMediaUrl } from "@/lib/storage";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

/**
 * Per-business SEO. Every value comes from `website_settings`, so two
 * businesses served by this same deployment get entirely different metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { business, settings, businessName } = await getSiteContext();

  const title = settings?.seo_title?.trim() || businessName;
  const description = settings?.seo_description?.trim() || settings?.tagline?.trim() || "";
  const ogImage = settings?.hero_image_path
    ? getPublicMediaUrl(settings.hero_image_path)
    : settings?.logo_path
      ? getPublicMediaUrl(settings.logo_path)
      : null;

  return {
    // `default` is the full SEO title for the homepage; `template` keeps
    // inner pages as "Shop | Business Name" rather than repeating the whole
    // SEO string on every page.
    title: { default: title, template: `%s | ${businessName}` },
    description,
    applicationName: businessName,
    openGraph: {
      title,
      description,
      siteName: businessName,
      type: "website",
      locale: "en_US",
      ...(ogImage ? { images: [{ url: ogImage, alt: businessName }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    alternates: { canonical: "/" },
    // A business that has uploaded a logo uses it as the browser-tab icon;
    // otherwise the platform's own src/app/icon.svg is served.
    ...(settings?.logo_path
      ? { icons: { icon: getPublicMediaUrl(settings.logo_path) } }
      : {}),
    other: { "business-slug": business.slug },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, businessName, type } = await getSiteContext();

  return (
    <>
      {/*
        The business's palette, injected as :root custom properties so it
        reaches <body> and every public component. Values are validated as
        6-digit hex by src/lib/theme.ts (and again by a CHECK constraint in
        the database), which is what makes this interpolation safe.
      */}
      <style dangerouslySetInnerHTML={{ __html: `:root{${buildThemeCss(settings)}}` }} />
      {/* Scroll-reveal sections start transparent and are faded in by an
          IntersectionObserver. Without JavaScript that observer never runs,
          which would leave the page blank — this makes them visible instead. */}
      <noscript>
        <style
          dangerouslySetInnerHTML={{
            __html: "[data-reveal]{opacity:1 !important;transform:none !important}",
          }}
        />
      </noscript>
      <div className="flex min-h-screen flex-col bg-surface">
        <SiteHeader
          businessName={businessName}
          logoPath={settings?.logo_path ?? null}
          catalogSegment={type.catalogSegment}
          catalogLabel={type.catalogLabel}
          heroIsDark={Boolean(settings?.hero_image_path)}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter businessName={businessName} settings={settings} />
      </div>
    </>
  );
}
