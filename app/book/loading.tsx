import { Skeleton } from "@/components/ui";

export default function BookLoading() {
  return (
    <div className="bg-alt px-4 py-8 @2xl:py-12" aria-label="กำลังโหลด">
      <div className="mx-auto max-w-2xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-14" />
        <Skeleton className="h-64 bg-white" />
        <Skeleton className="h-40 bg-white" />
      </div>
    </div>
  );
}
