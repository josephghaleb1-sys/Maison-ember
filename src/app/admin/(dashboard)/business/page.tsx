import type { Metadata } from "next";
import { requireBusinessContext } from "@/lib/dal";
import { getWebsiteSettings } from "@/lib/queries/admin";
import { BusinessInfoForm } from "@/components/admin/business-info-form";

export const metadata: Metadata = { title: "Business info" };

export default async function BusinessInfoPage() {
  const { business } = await requireBusinessContext();
  const settings = await getWebsiteSettings(business.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-cream-50">Business info</h1>
        <p className="mt-1 text-sm text-charcoal-400">
          Your name, story and contact details. These appear across your public website.
        </p>
      </div>
      <BusinessInfoForm settings={settings} />
    </div>
  );
}
