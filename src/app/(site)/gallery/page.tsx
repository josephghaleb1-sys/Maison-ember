import type { Metadata } from "next";
import Image from "next/image";
import { Images } from "lucide-react";
import { getPublicGalleryMedia } from "@/lib/business";
import { getPublicMediaUrl } from "@/lib/storage";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const gallery = await getPublicGalleryMedia();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Reveal className="text-center">
        <h1 className="font-display text-4xl font-semibold text-cream-50">Gallery</h1>
        <p className="mt-2 text-charcoal-400">A look inside the dining room and kitchen.</p>
      </Reveal>

      {gallery.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center text-charcoal-500">
          <Images className="size-10" aria-hidden />
          <p>Photos are coming soon.</p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((item, i) => (
            <Reveal key={item.id} delay={(i % 6) * 60}>
              <div className="group relative aspect-square overflow-hidden rounded-xl bg-charcoal-800">
                <Image
                  src={getPublicMediaUrl(item.storage_path)}
                  alt={item.alt_text || "Maison Ember"}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
