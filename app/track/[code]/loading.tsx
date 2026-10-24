import { Skeleton } from "@/components/ui";

export default function TrackLoading() {
  return (
    <div className="bg-alt px-4 py-8" aria-label="กำลังโหลด">
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-16 bg-white" />
        <Skeleton className="h-80 bg-white" />
        <Skeleton className="h-48 bg-white" />
      </div>
    </div>
  );
}
