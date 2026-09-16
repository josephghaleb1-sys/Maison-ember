import type { Metadata } from "next";
import { requireBusinessContext } from "@/lib/dal";
import { getWebsiteSettings } from "@/lib/queries/admin";
import { WebsiteForm } from "@/components/admin/website-form";

export const metadata: Metadata = { title: "Website" };

export default async function WebsitePage() {
  const { business } = await requireBusinessContext();
  const settings = await getWebsiteSettings(business.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-cream-50">Website</h1>
        <p className="mt-1 text-sm text-charcoal-400">
          Colors, homepage hero and how your site appears in search results.
        </p>
      </div>
      <WebsiteForm
        settings={settings}
        businessName={settings?.business_name || business.name}
      />
    </div>
  );
}
