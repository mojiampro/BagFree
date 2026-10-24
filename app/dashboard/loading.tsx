import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="bg-alt px-4 py-8 @2xl:py-12" aria-label="กำลังโหลด">
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-12 w-72" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-36 bg-white" />
        ))}
      </div>
    </div>
  );
}
