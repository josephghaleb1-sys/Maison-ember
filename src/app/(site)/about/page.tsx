import type { Metadata } from "next";
import Image from "next/image";
import { getPublicGalleryMedia, getSiteContext } from "@/lib/business";
import { getPublicMediaUrl } from "@/lib/storage";
import { BrandMark } from "@/components/site/brand-mark";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { Tilt } from "@/components/site/tilt";
import { ButtonLink } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName, settings } = await getSiteContext();
  return {
    title: "About",
    description: settings?.tagline || `About ${businessName}.`,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const [{ businessName, settings, preset }, gallery] = await Promise.all([
    getSiteContext(),
    getPublicGalleryMedia(),
  ]);

  const paragraphs = (settings?.about_text || "").split(/\n+/).filter(Boolean);
  const collage = gallery.slice(0, 3);

  return (
    <>
      <Section className="pb-0 pt-32 sm:pt-36">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <BrandMark name={businessName} logoPath={settings?.logo_path ?? null} size={72} />
          <h1 className="mt-7 font-display text-4xl font-semibold text-ink-50 text-balance sm:text-5xl">
            About {businessName}
          </h1>
          {settings?.tagline && (
            <p className="eyebrow mt-5 text-accent">{settings.tagline}</p>
          )}
        </Reveal>
      </Section>

      <Section className="pt-14">
        <div
          className={
            collage.length > 0
              ? "grid grid-cols-1 gap-14 lg:grid-cols-[1.1fr_0.9fr]"
              : "mx-auto max-w-3xl"
          }
        >
          <Reveal className="space-y-6 text-lg leading-relaxed text-ink-200">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
            ) : (
              <p className="text-ink-400">Our story is coming soon.</p>
            )}
            <div className="flex flex-wrap gap-3 pt-4">
              <ButtonLink href={preset.catalogPath}>{preset.heroCta}</ButtonLink>
              <ButtonLink href="/contact" variant="outline">
                {preset.contactHeading}
              </ButtonLink>
            </div>
          </Reveal>

          {collage.length > 0 && (
            <Reveal delay={140} className="grid grid-cols-2 gap-4">
              {collage.map((item, index) => (
                <Tilt
                  key={item.id}
                  strength={6}
                  className={index === 0 ? "col-span-2" : undefined}
                >
                  <div
                    className={`relative overflow-hidden rounded-2xl border border-ink-800 ${
                      index === 0 ? "aspect-[16/10]" : "aspect-square"
                    }`}
                  >
                    <Image
                      src={getPublicMediaUrl(item.storage_path)}
                      alt={item.alt_text || businessName}
                      fill
                      sizes="(min-width: 1024px) 40vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                </Tilt>
              ))}
            </Reveal>
          )}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {preset.highlights.map((highlight, index) => (
            <Reveal key={highlight} delay={index * 90}>
              <div className="rounded-2xl border border-ink-800 bg-ink-900/50 p-6 text-center">
                <p className="font-display text-xl text-accent">{highlight}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
