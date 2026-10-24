import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackingView } from "@/app/track/[code]/tracking-view";
import { ErrorState } from "@/components/ui";
import { getMyBooking } from "@/lib/data";
import { requestTimestamp } from "@/lib/time";

export async function generateMetadata({ params }: PageProps<"/track/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: `ติดตาม ${code.toUpperCase()}` };
}

export default async function TrackPage({ params }: PageProps<"/track/[code]">) {
  const { code } = await params;
  const { data: booking, error } = await getMyBooking(code);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <ErrorState title="โหลดข้อมูลการติดตามไม่สำเร็จ" message={error} />
      </div>
    );
  }
  if (!booking) notFound();

  return <TrackingView initialBooking={booking} serverNow={requestTimestamp()} />;
}
