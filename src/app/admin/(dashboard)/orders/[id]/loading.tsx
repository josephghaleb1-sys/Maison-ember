import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-3xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
      <Skeleton className="h-56 w-full" />
    </div>
  );
}
