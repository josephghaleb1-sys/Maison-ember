import type { Metadata } from "next";
import { requireBusinessContext } from "@/lib/dal";
import { getDeliveryZones, getWebsiteSettings } from "@/lib/queries/admin";
import { DeliveryManager } from "@/components/admin/delivery-manager";

export const metadata: Metadata = { title: "Delivery" };

export default async function DeliveryPage() {
  const { business } = await requireBusinessContext();
  const [zones, settings] = await Promise.all([
    getDeliveryZones(business.id),
    getWebsiteSettings(business.id),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-50">Delivery &amp; checkout</h1>
        <p className="text-sm text-ink-400">
          Where you deliver, what it costs, and whether the website takes orders.
        </p>
      </div>
      <DeliveryManager zones={zones} settings={settings} />
    </div>
  );
}
