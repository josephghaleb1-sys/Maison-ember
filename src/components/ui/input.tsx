import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldClasses =
  "block w-full rounded-lg border border-charcoal-700 bg-charcoal-900 px-3 py-2 text-sm text-cream-50 placeholder:text-charcoal-500 focus:border-ember-400 focus:outline focus:outline-2 focus:outline-ember-500 disabled:bg-charcoal-800 disabled:text-charcoal-500";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldClasses, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClasses, "min-h-24 resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClasses, "pr-8", className)} {...props} />
));
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-charcoal-200", className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: string | string[] | null }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  const messages = Array.isArray(children) ? children : [children];
  return (
    <p className="mt-1.5 text-sm text-red-600">
      {messages.join(" ")}
    </p>
  );
}
