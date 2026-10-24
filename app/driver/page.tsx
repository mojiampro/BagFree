import type { Metadata } from "next";
import { DriverConsole } from "@/app/driver/driver-console";
import { ErrorState } from "@/components/ui";
import { getMyBookings } from "@/lib/data";

export const metadata: Metadata = { title: "Live Driver Mode" };

export default async function DriverPage() {
  const { data: bookings, error } = await getMyBookings();
  const deliveries = (bookings ?? []).filter(
    (booking) => booking.service_type === "delivery" && (booking.status === "picked_up" || booking.status === "in_transit"),
  );

  return (
    <div className="bg-alt px-4 py-8 @2xl:py-12">
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Live Driver Mode</h1>
          <p className="mt-1 text-sm text-muted">
            จำลองฝั่งคนขับ: เปิดหน้านี้บนมือถือ เลือกงานส่ง แล้วแชร์ตำแหน่ง GPS — ผู้ใช้จะเห็นรถเคลื่อนที่จริงบนหน้าติดตาม
          </p>
        </div>
        {!bookings ? (
          <ErrorState title="โหลดงานส่งไม่สำเร็จ" message={error ?? ""} />
        ) : (
          <DriverConsole deliveries={deliveries} />
        )}
      </div>
    </div>
  );
}
