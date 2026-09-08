import { getPublicBusiness, getPublicSettings } from "@/lib/business";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [business, settings] = await Promise.all([getPublicBusiness(), getPublicSettings()]);
  const businessName = settings?.business_name || business.name;

  return (
    <div className="flex min-h-screen flex-col bg-cream-100">
      <SiteHeader businessName={businessName} />
      <main className="flex-1">{children}</main>
      <SiteFooter businessName={businessName} settings={settings} />
    </div>
  );
}
