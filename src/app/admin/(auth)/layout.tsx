import { getSignedOutBranding } from "@/lib/business";
import { BrandMark } from "@/components/site/brand-mark";

/**
 * Shell for the signed-out screens. Branding comes from the business this
 * deployment serves — nothing here is hard-coded to one customer.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { name, logoPath } = await getSignedOutBranding();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark name={name} logoPath={logoPath} size={52} />
          <h1 className="font-display text-2xl font-semibold uppercase tracking-[0.2em] text-ink-50">
            {name}
          </h1>
          <p className="text-sm text-ink-400">Business dashboard</p>
        </div>
        <div className="rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-xl sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
