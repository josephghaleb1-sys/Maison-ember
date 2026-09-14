"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/dal";
import { testimonialSchema } from "@/lib/validation/testimonial";
import type { FormState } from "@/lib/actions/auth";

function revalidateAll() {
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function createTestimonial(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { business } = await requireBusinessContext();

  const parsed = testimonialSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("testimonials")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  const { error } = await supabase.from("testimonials").insert({
    business_id: business.id,
    author_name: parsed.data.author_name,
    author_role: parsed.data.author_role,
    quote: parsed.data.quote,
    rating: parsed.data.rating,
    sort_order: count ?? 0,
  });

  if (error) return { error: `Couldn't add the review: ${error.message}` };

  revalidateAll();
  return { message: "Review added." };
}

export async function deleteTestimonial(testimonialId: string): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("testimonials")
    .delete()
    .eq("id", testimonialId)
    .eq("business_id", business.id);

  if (error) return { error: `Couldn't delete the review: ${error.message}` };

  revalidateAll();
  return {};
}

export async function setTestimonialVisibility(
  testimonialId: string,
  isVisible: boolean,
): Promise<{ error?: string }> {
  const { business } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("testimonials")
    .update({ is_visible: isVisible })
    .eq("id", testimonialId)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidateAll();
  return {};
}
