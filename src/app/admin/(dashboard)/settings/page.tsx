import type { Metadata } from "next";
import { requireBusinessContext } from "@/lib/dal";
import { getWebsiteSettings } from "@/lib/queries/admin";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { business } = await requireBusinessContext();
  const settings = await getWebsiteSettings(business.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal-900">Business settings</h1>
        <p className="text-sm text-charcoal-500">Changes here appear live on your public site.</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
