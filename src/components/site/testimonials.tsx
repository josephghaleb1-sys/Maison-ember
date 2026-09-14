import { Star } from "lucide-react";
import type { Testimonial } from "@/lib/database.types";
import { Reveal } from "@/components/site/reveal";
import { Tilt } from "@/components/site/tilt";

export function TestimonialGrid({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
      {testimonials.slice(0, 6).map((testimonial, index) => (
        <Reveal key={testimonial.id} delay={index * 90} className="h-full">
          <Tilt strength={5} className="h-full">
            <figure className="flex h-full flex-col rounded-2xl border border-ink-800 bg-ink-900/60 p-6 transition-colors duration-500 hover:border-accent/40">
              <div className="flex gap-1" aria-label={`${testimonial.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star
                    key={starIndex}
                    className={
                      starIndex < testimonial.rating
                        ? "size-3.5 fill-accent text-accent"
                        : "size-3.5 text-ink-700"
                    }
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 font-display text-lg leading-relaxed text-ink-100">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-5 border-t border-ink-800 pt-4 text-sm">
                <span className="font-medium text-ink-50">{testimonial.author_name}</span>
                {testimonial.author_role && (
                  <span className="block text-xs uppercase tracking-[0.16em] text-ink-500">
                    {testimonial.author_role}
                  </span>
                )}
              </figcaption>
            </figure>
          </Tilt>
        </Reveal>
      ))}
    </div>
  );
}
