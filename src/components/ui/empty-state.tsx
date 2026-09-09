import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-charcoal-700 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-ember-500/15 text-ember-300">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-cream-50">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-charcoal-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
