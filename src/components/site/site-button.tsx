import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The public site's button. Separate from components/ui/button, which is the
 * dashboard's: this one is painted entirely in brand tokens, so it changes
 * appearance with the served business, while the dashboard button stays on
 * the platform's fixed chrome.
 */
type Variant = "primary" | "outline" | "quiet";
type Size = "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-on-brand hover:bg-brand-strong focus-visible:outline-brand",
  outline:
    "border border-brand-line text-brand-ink hover:bg-brand-tint focus-visible:outline-brand",
  quiet:
    "border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20 focus-visible:outline-white",
};

const sizeClasses: Record<Size, string> = {
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

const base =
  "inline-flex items-center justify-center rounded-full font-medium tracking-wide transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function SiteButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link
      href={href}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Same styling for links that leave the site (tel:, mailto:, wa.me, maps). */
export function SiteLinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
} & ComponentProps<"a">) {
  return (
    <a
      href={href}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </a>
  );
}
