"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";
import type { Testimonial } from "@/lib/database.types";
import type { FormState } from "@/lib/actions/auth";
import {
  createTestimonial,
  deleteTestimonial,
  setTestimonialVisibility,
} from "@/lib/actions/testimonials";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { EmptyState } from "@/components/ui/empty-state";

const initialState: FormState = {};

export function TestimonialManager({ testimonials }: { testimonials: Testimonial[] }) {
  const [state, formAction, isPending] = useActionState(createTestimonial, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // `state` is a fresh object on every submission, so this re-runs even when
  // two successful submissions produce the same message.
  useEffect(() => {
    if (!state.message) return;
    formRef.current?.reset();
    toast.success(state.message);
    router.refresh();
  }, [state, router]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add a review</CardTitle>
        </CardHeader>
        <CardBody>
          <form ref={formRef} action={formAction} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="author_name">Name</Label>
                <Input id="author_name" name="author_name" required maxLength={80} />
              </div>
              <div>
                <Label htmlFor="author_role">Where they&apos;re from</Label>
                <Input
                  id="author_role"
                  name="author_role"
                  maxLength={80}
                  placeholder="Optional — e.g. Beirut"
                />
              </div>
              <div>
                <Label htmlFor="rating">Rating</Label>
                <Select id="rating" name="rating" defaultValue="5">
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} star{value === 1 ? "" : "s"}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="quote">What they said</Label>
              <Textarea id="quote" name="quote" rows={3} required maxLength={600} />
            </div>
            <FieldError>{state.error}</FieldError>
            <Button type="submit" size="sm" loading={isPending}>
              Add review
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Published reviews</CardTitle>
        </CardHeader>
        <CardBody>
          {testimonials.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No reviews yet"
              description="Add a customer review above — they appear on your homepage and build trust fast."
            />
          ) : (
            <ul className="divide-y divide-ink-800">
              {testimonials.map((testimonial) => (
                <li key={testimonial.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink-50">{testimonial.author_name}</p>
                      {testimonial.author_role && (
                        <span className="text-xs text-ink-500">{testimonial.author_role}</span>
                      )}
                      <span className="flex gap-0.5" aria-label={`${testimonial.rating} of 5`}>
                        {Array.from({ length: testimonial.rating }).map((_, index) => (
                          <Star key={index} className="size-3 fill-accent text-accent" aria-hidden />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-300">{testimonial.quote}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <VisibilityToggle
                      checked={testimonial.is_visible}
                      label={`Show ${testimonial.author_name}'s review on the website`}
                      action={(next) => setTestimonialVisibility(testimonial.id, next)}
                    />
                    <ConfirmDialog
                      title="Delete this review?"
                      description={`“${testimonial.quote.slice(0, 80)}…” will be removed from your website.`}
                      confirmLabel="Delete"
                      successMessage="Review deleted."
                      action={() => deleteTestimonial(testimonial.id)}
                      trigger={
                        <button
                          type="button"
                          aria-label="Delete review"
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-red-400"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
