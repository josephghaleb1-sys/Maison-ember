import { Toaster } from "sonner";
import { requireBusinessContext } from "@/lib/dal";
import { getWebsiteSettings } from "@/lib/queries/admin";
import { buildNavItems } from "@/components/admin/nav-items";
import { Sidebar } from "@/components/admin/sidebar";
import { MobileNav } from "@/components/admin/mobile-nav";
import { Topbar } from "@/components/admin/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { business, email, preset, role } = await requireBusinessContext();
  const settings = await getWebsiteSettings(business.id);
  const items = buildNavItems(preset);
  const businessName = settings?.business_name || business.name;

  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar
        businessName={businessName}
        logoPath={settings?.logo_path ?? null}
        items={items}
      />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <Topbar email={email} role={role} siteHref="/" />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <MobileNav items={items} />
      <Toaster position="top-right" richColors closeButton theme="dark" />
    </div>
  );
}
