import type { Metadata } from "next";
import { requireBusinessContext } from "@/lib/dal";
import { getTestimonials } from "@/lib/queries/admin";
import { TestimonialManager } from "@/components/admin/testimonial-manager";

export const metadata: Metadata = { title: "Reviews" };

export default async function TestimonialsPage() {
  const { business } = await requireBusinessContext();
  const testimonials = await getTestimonials(business.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-50">Reviews</h1>
        <p className="text-sm text-ink-400">
          Customer words, shown on your homepage. Hide one to take it off the site without deleting it.
        </p>
      </div>
      <TestimonialManager testimonials={testimonials} />
    </div>
  );
}
