import { requireBusinessContext } from "@/lib/dal";
import { getPublicSiteHref } from "@/lib/queries/admin";
import { Sidebar } from "@/components/admin/sidebar";
import { MobileNav } from "@/components/admin/mobile-nav";
import { Topbar } from "@/components/admin/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { business, email, type } = await requireBusinessContext();
  const siteHref = await getPublicSiteHref(business.id);

  return (
    <div className="flex min-h-screen bg-charcoal-950">
      <Sidebar businessName={business.name} type={type} />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <Topbar email={email} siteHref={siteHref} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <MobileNav type={type} />
    </div>
  );
}
