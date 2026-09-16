import type { Metadata } from "next";
import Image from "next/image";
import { getPublicGalleryMedia, getSiteContext } from "@/lib/business";
import { getPublicMediaUrl } from "@/lib/storage";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName } = await getSiteContext();
  return {
    title: "Gallery",
    description: `A look inside ${businessName}.`,
    alternates: { canonical: "/gallery" },
  };
}

export default async function GalleryPage() {
  const [{ businessName }, gallery] = await Promise.all([
    getSiteContext(),
    getPublicGalleryMedia(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-32 sm:px-6 sm:pb-24 sm:pt-36">
      <Reveal>
        <SectionHeading
          eyebrow="Gallery"
          title={`Inside ${businessName}`}
          align="center"
        />
      </Reveal>

      {gallery.length === 0 ? (
        <Reveal delay={100}>
          <div className="mx-auto mt-20 max-w-md rounded-2xl border border-line bg-surface-1 px-6 py-14 text-center">
            <p className="font-display text-xl font-semibold text-ink">Photos coming soon</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              We&apos;re putting together a proper look inside. Check back shortly.
            </p>
          </div>
        </Reveal>
      ) : (
        // Masonry-ish columns rather than a rigid square grid, so portrait and
        // landscape uploads both sit naturally without being cropped.
        <div className="mt-14 columns-2 gap-4 lg:columns-3 [&>*]:mb-4">
          {gallery.map((item, i) => (
            <Reveal key={item.id} delay={(i % 6) * 70}>
              <figure className="group relative overflow-hidden rounded-2xl border border-line bg-surface-2 break-inside-avoid">
                <Image
                  src={getPublicMediaUrl(item.storage_path)}
                  alt={item.alt_text || ""}
                  width={800}
                  height={1000}
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="h-auto w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {item.alt_text && (
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {item.alt_text}
                  </figcaption>
                )}
              </figure>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
