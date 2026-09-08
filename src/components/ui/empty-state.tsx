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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-charcoal-200 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-ember-50 text-ember-600">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-charcoal-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-charcoal-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
