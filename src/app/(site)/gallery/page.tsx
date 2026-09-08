import type { Metadata } from "next";
import Image from "next/image";
import { Images } from "lucide-react";
import { getPublicGalleryMedia } from "@/lib/business";
import { getPublicMediaUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const gallery = await getPublicGalleryMedia();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold text-charcoal-900">Gallery</h1>
        <p className="mt-2 text-charcoal-500">A look inside the dining room and kitchen.</p>
      </div>

      {gallery.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center text-charcoal-400">
          <Images className="size-10" aria-hidden />
          <p>Photos are coming soon.</p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((item) => (
            <div key={item.id} className="relative aspect-square overflow-hidden rounded-xl bg-charcoal-100">
              <Image
                src={getPublicMediaUrl(item.storage_path)}
                alt={item.alt_text || "Maison Ember"}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
