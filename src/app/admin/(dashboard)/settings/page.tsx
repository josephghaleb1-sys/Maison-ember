import type { Metadata } from "next";
import { canManageBusinessConfig, requireBusinessContext } from "@/lib/dal";
import { getBusinessDomains } from "@/lib/queries/admin";
import { BusinessSettingsForm } from "@/components/admin/business-settings-form";
import { DomainManager } from "@/components/admin/domain-manager";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { business, role, email } = await requireBusinessContext();
  const domains = await getBusinessDomains(business.id);
  const canManage = canManageBusinessConfig(role);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-cream-50">Settings</h1>
        <p className="mt-1 text-sm text-charcoal-400">
          How this business is configured, and the domains its website is served on.
        </p>
      </div>

      <BusinessSettingsForm business={business} canManage={canManage} />

      <DomainManager domains={domains} canManage={canManage} />

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-charcoal-400">Signed in as</span>
            <span className="truncate font-medium text-cream-50">{email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-charcoal-400">Role</span>
            <span className="font-medium capitalize text-cream-50">{role}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-charcoal-400">Business ID</span>
            <span className="truncate font-mono text-xs text-charcoal-300">{business.id}</span>
          </div>
          <p className="border-t border-charcoal-800 pt-3 text-charcoal-500">
            To change your password, sign out and use “Forgot password” on the login screen.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
