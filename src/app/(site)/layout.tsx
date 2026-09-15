import type { Metadata } from "next";
import { getPublicProducts, getSiteContext, getSiteUrl } from "@/lib/business";
import { toCatalogEntries } from "@/lib/cart";
import { getPublicMediaUrl } from "@/lib/storage";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { FloatingContact } from "@/components/site/floating-contact";
import { CartProvider } from "@/components/site/cart/cart-context";
import { CartDrawer } from "@/components/site/cart/cart-drawer";
import { buildNavLinks } from "@/lib/navigation";
import { whatsappHref } from "@/lib/contact";

/**
 * SEO for the whole public site, straight from website_settings — so each
 * business on the platform controls its own title/description/social image
 * from the dashboard, and nothing here is hard-coded to one customer.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { businessName, settings } = await getSiteContext();
  const siteUrl = await getSiteUrl();

  const title = settings?.seo_title?.trim() || businessName;
  const description =
    settings?.seo_description?.trim() ||
    settings?.tagline?.trim() ||
    `${businessName} — official website.`;
  const socialImagePath = settings?.og_image_path || settings?.hero_image_path;

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s | ${businessName}` },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: businessName,
      title,
      description,
      url: siteUrl,
      images: socialImagePath ? [{ url: getPublicMediaUrl(socialImagePath) }] : undefined,
    },
    twitter: {
      card: socialImagePath ? "summary_large_image" : "summary",
      title,
      description,
      images: socialImagePath ? [getPublicMediaUrl(socialImagePath)] : undefined,
    },
    icons: settings?.logo_path ? { icon: getPublicMediaUrl(settings.logo_path) } : undefined,
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ business, businessName, settings, preset, theme }, products] = await Promise.all([
    getSiteContext(),
    getPublicProducts(),
  ]);
  const links = buildNavLinks(preset.catalogPath, preset.catalogLabel);
  const whatsapp = whatsappHref(
    settings?.whatsapp || settings?.phone,
    `Hi ${businessName}! I'd like to know more.`,
  );
  // Checkout is a setting, so a business that only takes orders by message can
  // switch the whole cart off.
  const checkoutEnabled = settings?.checkout_enabled ?? true;

  return (
    // The brand colours land here as CSS custom properties; every accent in
    // the tree resolves through them, so re-skinning is a settings change.
    <CartProvider slug={business.slug}>
      <div style={theme.style} className="flex min-h-screen flex-col bg-ink-950">
      {/* Scroll/entrance animations are progressive enhancement: without JS
          the content is still fully visible (and fully crawlable). */}
      <noscript>
        <style>{`[data-motion]{opacity:1 !important;transform:none !important}`}</style>
      </noscript>

      <SiteHeader
        businessName={businessName}
        logoPath={settings?.logo_path ?? null}
        links={links}
        ctaHref={preset.catalogPath}
        ctaLabel={preset.heroCta}
        showCart={checkoutEnabled}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter businessName={businessName} settings={settings} links={links} />
      {whatsapp && <FloatingContact href={whatsapp} />}
      {checkoutEnabled && (
        <CartDrawer
          catalog={toCatalogEntries(products)}
          currency={settings?.currency || "USD"}
          checkoutEnabled={checkoutEnabled}
          freeDeliveryOver={settings?.free_delivery_over ?? null}
          catalogPath={preset.catalogPath}
          catalogLabel={preset.catalogLabel}
        />
      )}
      </div>
    </CartProvider>
  );
}
