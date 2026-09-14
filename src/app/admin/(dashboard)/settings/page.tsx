import type { Metadata } from "next";
import { requireBusinessContext } from "@/lib/dal";
import { getWebsiteSettings } from "@/lib/queries/admin";
import { BusinessInfoForm } from "@/components/admin/business-info-form";

export const metadata: Metadata = { title: "Business info" };

export default async function BusinessInfoPage() {
  const { business } = await requireBusinessContext();
  const settings = await getWebsiteSettings(business.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-50">Business info</h1>
        <p className="text-sm text-ink-400">
          Name, contact details, hours and social links. These appear across your public site.
        </p>
      </div>
      <BusinessInfoForm business={business} settings={settings} />
    </div>
  );
}
