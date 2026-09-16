import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getSiteContext } from "@/lib/business";
import { getPublicMediaUrl } from "@/lib/storage";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteButton } from "@/components/site/site-button";
import { Reveal } from "@/components/site/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName, settings } = await getSiteContext();
  return {
    title: "About",
    description: settings?.tagline || `About ${businessName}.`,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const { settings, businessName, type } = await getSiteContext();
  const paragraphs = (settings?.about_text || "").split(/\n+/).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6 sm:pb-24 sm:pt-36">
      <Reveal className="flex flex-col items-center">
        {settings?.logo_path && (
          <div className="relative mb-8 size-24 overflow-hidden rounded-full ring-1 ring-brand-line">
            <Image
              src={getPublicMediaUrl(settings.logo_path)}
              alt={`${businessName} logo`}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
        )}
        <SectionHeading
          eyebrow={settings?.tagline || undefined}
          title={`About ${businessName}`}
          align="center"
        />
      </Reveal>

      <Reveal delay={120} className="mt-12">
        {paragraphs.length > 0 ? (
          <div className="space-y-6">
            {paragraphs.map((paragraph, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "text-xl leading-relaxed text-ink"
                    : "text-lg leading-relaxed text-ink-muted"
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-center text-ink-faint">More about us is coming soon.</p>
        )}
      </Reveal>

      <Reveal delay={200} className="mt-14 flex flex-wrap justify-center gap-3">
        <SiteButton href={`/${type.catalogSegment}`} size="lg">
          {type.ctaLabel} <ArrowRight className="size-4" aria-hidden />
        </SiteButton>
        <SiteButton href="/contact" size="lg" variant="outline">
          {type.visitLabel}
        </SiteButton>
      </Reveal>
    </div>
  );
}
