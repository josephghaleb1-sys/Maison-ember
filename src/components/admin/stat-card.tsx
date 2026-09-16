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
          <p className="text-sm text-charcoal-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-cream-50">{value}</p>
          {hint && <p className="mt-1 text-xs text-charcoal-500">{hint}</p>}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
          <Icon className="size-5" aria-hidden />
        </div>
      </CardBody>
    </Card>
  );
}
