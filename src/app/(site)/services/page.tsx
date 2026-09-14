import { CatalogPage, catalogMetadata } from "@/components/site/catalog";

// The catalogue lives at /shop, /menu and /services; the business's industry
// decides which one is canonical, and CatalogPage redirects the other two.
export const generateMetadata = catalogMetadata;

export default function Page() {
  return <CatalogPage path="/services" />;
}
