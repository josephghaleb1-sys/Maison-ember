import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "success" | "warning";
}) {
  const variantClasses = {
    neutral: "bg-charcoal-100 text-charcoal-600",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses,
        className,
      )}
      {...props}
    />
  );
}
