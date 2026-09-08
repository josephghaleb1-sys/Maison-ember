import type { LucideIcon } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-charcoal-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-charcoal-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-charcoal-400">{hint}</p>}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ember-50 text-ember-600">
          <Icon className="size-5" aria-hidden />
        </div>
      </CardBody>
    </Card>
  );
}
