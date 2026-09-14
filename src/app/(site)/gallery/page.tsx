import type { Metadata } from "next";
import Image from "next/image";
import { Images } from "lucide-react";
import { getPublicGalleryMedia, getSiteContext } from "@/lib/business";
import { getPublicMediaUrl } from "@/lib/storage";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { Tilt } from "@/components/site/tilt";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName, preset } = await getSiteContext();
  return {
    title: "Gallery",
    description: `${preset.galleryIntro} — ${businessName}.`,
    alternates: { canonical: "/gallery" },
  };
}

export default async function GalleryPage() {
  const [{ businessName, preset }, gallery] = await Promise.all([
    getSiteContext(),
    getPublicGalleryMedia(),
  ]);

  return (
    <>
      <Section className="pb-0 pt-32 sm:pt-36">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-accent">{businessName}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-ink-50 sm:text-5xl">
            Gallery
          </h1>
          <p className="mt-5 text-base text-ink-300">{preset.galleryIntro}</p>
        </Reveal>
      </Section>

      <Section>
        {gallery.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink-700 px-6 py-20 text-center">
            <Images className="size-9 text-accent/60" aria-hidden />
            <p className="text-ink-300">Photos are coming soon.</p>
          </div>
        ) : (
          // A light masonry: every third tile spans two rows, which breaks the
          // grid up without needing JS measurement.
          <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((item, index) => (
              <Reveal
                key={item.id}
                delay={(index % 4) * 70}
                className={index % 7 === 0 ? "sm:col-span-2 sm:row-span-2" : undefined}
              >
                <Tilt strength={7} className="h-full">
                  <div
                    className={`relative h-full overflow-hidden rounded-xl border border-ink-800 ${
                      index % 7 === 0 ? "aspect-square sm:aspect-auto sm:min-h-full" : "aspect-square"
                    }`}
                  >
                    <Image
                      src={getPublicMediaUrl(item.storage_path)}
                      alt={item.alt_text || businessName}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-out hover:scale-105 motion-reduce:transition-none"
                    />
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
