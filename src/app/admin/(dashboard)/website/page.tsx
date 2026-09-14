import type { Metadata } from "next";
import { requireBusinessContext } from "@/lib/dal";
import { getDomains, getWebsiteSettings } from "@/lib/queries/admin";
import { WebsiteForm } from "@/components/admin/website-form";
import { DomainManager } from "@/components/admin/domain-manager";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Website" };

export default async function WebsitePage() {
  const { business } = await requireBusinessContext();
  const [settings, domains] = await Promise.all([
    getWebsiteSettings(business.id),
    getDomains(business.id),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-50">Website</h1>
        <p className="text-sm text-ink-400">
          Colours, hero copy, images and search-engine details. Saved changes appear on your public
          site immediately.
        </p>
      </div>

      <WebsiteForm settings={settings} />

      <Card>
        <CardHeader>
          <CardTitle>Custom domains</CardTitle>
        </CardHeader>
        <CardBody>
          <DomainManager domains={domains} />
        </CardBody>
      </Card>
    </div>
  );
}
