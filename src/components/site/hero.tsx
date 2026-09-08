import Image from "next/image";
import { Flame } from "lucide-react";
import { getPublicMediaUrl } from "@/lib/storage";

export function Hero({
  imagePath,
  title,
  tagline,
  children,
}: {
  imagePath: string | null;
  title: string;
  tagline: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-charcoal-950 sm:min-h-[80vh]">
      {imagePath ? (
        <Image
          src={getPublicMediaUrl(imagePath)}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-charcoal-950 via-ember-950 to-charcoal-900">
          <Flame className="size-40 text-ember-800/40" aria-hidden />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-transparent" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-white text-balance sm:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-charcoal-200">{tagline}</p>
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
