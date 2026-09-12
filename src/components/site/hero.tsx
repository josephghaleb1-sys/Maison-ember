import Image from "next/image";
import { Flame } from "lucide-react";
import { getPublicMediaUrl } from "@/lib/storage";
import { EmberParticles } from "@/components/site/ember-particles";

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
        <div
          className="absolute inset-0 overflow-hidden bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-charcoal-950"
          aria-hidden
        >
          {/* Ambient hearth glow cast onto the dark wall */}
          <div className="absolute bottom-[-20%] left-[62%] h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-ember-600/35 blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[62%] h-[38vh] w-[38vh] -translate-x-1/2 rounded-full bg-ember-300/30 blur-[60px]" />

          {/* Layered flame silhouette, back (soft glow) to front (bright core) */}
          <Flame
            fill="currentColor"
            className="animate-flame-flicker motion-reduce:animate-none absolute bottom-[26%] left-[62%] size-56 -translate-x-1/2 text-ember-700/70 blur-md sm:bottom-[4%] sm:size-96"
          />
          <Flame
            fill="currentColor"
            className="animate-flame-flicker motion-reduce:animate-none absolute bottom-[26%] left-[62%] size-40 -translate-x-1/2 text-ember-500/90 sm:bottom-[4%] sm:size-72"
            style={{ animationDelay: "180ms" }}
          />
          <Flame
            fill="currentColor"
            className="animate-flame-flicker motion-reduce:animate-none absolute bottom-[26%] left-[62%] size-24 -translate-x-1/2 text-ember-200 sm:bottom-[4%] sm:size-40"
            style={{ animationDelay: "90ms" }}
          />
        </div>
      )}
      <EmberParticles />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/55 to-transparent" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:px-6">
        <h1 className="animate-fade-up font-display text-4xl font-semibold text-white text-balance sm:text-6xl">
          {title}
        </h1>
        <p
          className="animate-fade-up mt-4 max-w-xl text-lg text-charcoal-200"
          style={{ animationDelay: "150ms" }}
        >
          {tagline}
        </p>
        {children && (
          <div
            className="animate-fade-up mt-8 flex flex-wrap gap-3"
            style={{ animationDelay: "300ms" }}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
