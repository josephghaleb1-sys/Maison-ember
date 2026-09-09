import { requireBusinessContext } from "@/lib/dal";
import { Sidebar } from "@/components/admin/sidebar";
import { MobileNav } from "@/components/admin/mobile-nav";
import { Topbar } from "@/components/admin/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { business, email } = await requireBusinessContext();

  return (
    <div className="flex min-h-screen bg-charcoal-950">
      <Sidebar businessName={business.name} />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <Topbar email={email} siteHref="/" />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
