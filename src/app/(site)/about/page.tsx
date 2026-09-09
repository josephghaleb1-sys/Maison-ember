import type { Metadata } from "next";
import Image from "next/image";
import { getPublicBusiness, getPublicSettings } from "@/lib/business";
import { getPublicMediaUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const [business, settings] = await Promise.all([getPublicBusiness(), getPublicSettings()]);
  const businessName = settings?.business_name || business.name;
  const paragraphs = (settings?.about_text || "").split(/\n+/).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {settings?.logo_path && (
        <div className="relative mx-auto mb-6 size-20 overflow-hidden rounded-full bg-charcoal-900 shadow">
          <Image
            src={getPublicMediaUrl(settings.logo_path)}
            alt={`${businessName} logo`}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      )}
      <h1 className="text-center font-display text-4xl font-semibold text-cream-50">
        About {businessName}
      </h1>
      {settings?.tagline && (
        <p className="mt-3 text-center text-lg text-ember-300">{settings.tagline}</p>
      )}

      <div className="mt-10 space-y-5 text-lg leading-relaxed text-charcoal-200">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)
        ) : (
          <p className="text-charcoal-500">More about us is coming soon.</p>
        )}
      </div>
    </div>
  );
}
