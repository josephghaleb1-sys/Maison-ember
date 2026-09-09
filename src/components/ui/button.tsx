import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ember-600 text-white hover:bg-ember-700 focus-visible:outline-ember-600 disabled:bg-ember-300",
  secondary:
    "bg-charcoal-900 text-white hover:bg-charcoal-800 focus-visible:outline-charcoal-300 disabled:bg-charcoal-700",
  outline:
    "border border-charcoal-700 bg-charcoal-900 text-cream-100 hover:bg-charcoal-800 focus-visible:outline-charcoal-400 disabled:text-charcoal-500",
  ghost:
    "text-charcoal-200 hover:bg-charcoal-800 focus-visible:outline-charcoal-400 disabled:text-charcoal-300",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 disabled:bg-red-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
