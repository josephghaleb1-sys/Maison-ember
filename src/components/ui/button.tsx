import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-on-accent hover:bg-accent-bright focus-visible:outline-accent disabled:opacity-60",
  secondary:
    "bg-brand text-on-brand hover:bg-brand-deep focus-visible:outline-brand disabled:opacity-60",
  outline:
    "border border-accent/45 text-accent hover:bg-accent hover:text-on-accent focus-visible:outline-accent disabled:opacity-50",
  ghost: "text-ink-200 hover:bg-ink-800 focus-visible:outline-ink-400 disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600 disabled:opacity-60",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-xs tracking-[0.12em] gap-1.5",
  md: "h-11 px-5 text-[0.8125rem] tracking-[0.14em] gap-2",
  lg: "h-13 px-7 text-sm tracking-[0.16em] gap-2.5",
};

const baseClasses =
  "inline-flex items-center justify-center rounded-full font-medium uppercase transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed";

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

/**
 * Button-styled link. Used instead of wrapping a <button> in a <Link>, which
 * nests interactive elements and breaks keyboard/screen-reader semantics.
 */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  external,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  size?: Size;
  external?: boolean;
}) {
  const classes = buttonClasses(variant, size, className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
