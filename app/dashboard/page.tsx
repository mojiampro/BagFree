import type { Metadata } from "next";
import { DashboardView } from "@/app/dashboard/dashboard-view";
import { ErrorState } from "@/components/ui";
import { getMyBookings } from "@/lib/data";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "การจองของฉัน" };

export default async function DashboardPage() {
  const [user, bookings] = await Promise.all([getCurrentUser(), getMyBookings()]);
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <div className="bg-alt px-4 py-8 @2xl:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm text-muted">สวัสดี{name ? ` คุณ${name}` : ""}</p>
          <h1 className="text-2xl font-bold text-navy">การจองของฉัน</h1>
        </div>
        {bookings.data ? (
          <DashboardView initialBookings={bookings.data} />
        ) : (
          <ErrorState title="โหลดการจองไม่สำเร็จ" message={bookings.error ?? ""} />
        )}
      </div>
    </div>
  );
}
