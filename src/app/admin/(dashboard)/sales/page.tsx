import type { Metadata } from "next";
import { requireBusinessContext } from "@/lib/dal";
import { getProducts, getWebsiteSettings } from "@/lib/queries/admin";
import { SaleManager } from "@/components/admin/sale-manager";

export const metadata: Metadata = { title: "Sales" };

export default async function SalesPage() {
  const { business, preset } = await requireBusinessContext();
  const [products, settings] = await Promise.all([
    getProducts(business.id),
    getWebsiteSettings(business.id),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-50">Sales</h1>
        <p className="text-sm text-ink-400">
          Put {preset.itemNounPlural} on sale. The old price is shown struck through on your
          website, and customers are charged the sale price at checkout.
        </p>
      </div>
      <SaleManager
        products={products}
        currency={settings?.currency || "USD"}
        itemNounPlural={preset.itemNounPlural}
      />
    </div>
  );
}
