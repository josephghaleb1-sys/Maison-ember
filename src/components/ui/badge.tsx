import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "success" | "warning";
}) {
  const variantClasses = {
    neutral: "bg-charcoal-800 text-charcoal-300",
    success: "bg-green-500/15 text-green-400",
    warning: "bg-amber-500/15 text-amber-400",
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
