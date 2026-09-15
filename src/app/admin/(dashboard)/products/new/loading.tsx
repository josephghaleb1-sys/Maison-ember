import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-2xl space-y-5">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-2 gap-5">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
