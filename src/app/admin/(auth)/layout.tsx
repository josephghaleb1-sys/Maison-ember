import Image from "next/image";
import { getOptionalBrand } from "@/lib/business";
import { getPublicMediaUrl } from "@/lib/storage";

/**
 * Sign-in chrome. The business is resolved from the request's hostname, so an
 * owner signing in at their own domain sees their own name and logo — and a
 * deployment with no domain mapping still renders a usable, unbranded screen
 * rather than 404ing anyone out of their dashboard.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const brand = await getOptionalBrand();
  const name = brand?.name ?? "Dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {brand?.logoPath ? (
            <span className="relative size-12 overflow-hidden rounded-full ring-1 ring-charcoal-700">
              <Image
                src={getPublicMediaUrl(brand.logoPath)}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </span>
          ) : (
            <span
              aria-hidden
              className="flex size-12 items-center justify-center rounded-full bg-ember-600 font-display text-xl font-semibold text-white"
            >
              {name.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <h1 className="font-display text-2xl font-semibold text-white">{name}</h1>
          <p className="text-sm text-charcoal-300">Business dashboard</p>
        </div>
        <div className="rounded-xl border border-charcoal-800 bg-charcoal-900 p-6 shadow-xl sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
