import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentPoller } from "@/app/book/confirm/[code]/payment-poller";
import { BookingDetails } from "@/components/booking/booking-details";
import { StepIndicator } from "@/components/booking/step-indicator";
import { CheckIcon } from "@/components/icons";
import { buttonClass, cardClass, ErrorState } from "@/components/ui";
import { getMyBooking } from "@/lib/data";
import { formatBaht } from "@/lib/format";

export const metadata: Metadata = { title: "ยืนยันการจอง" };

export default async function ConfirmPage({ params }: PageProps<"/book/confirm/[code]">) {
  const { code } = await params;
  const { data: booking, error } = await getMyBooking(code);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <ErrorState title="โหลดการจองไม่สำเร็จ" message={error} />
      </div>
    );
  }
  if (!booking) notFound();

  const settled = booking.payment_status === "paid" || booking.payment_status === "pay_at_counter";
  const awaitingStripe = !settled && booking.payment_status === "unpaid" && booking.payment_method !== null;

  return (
    <div className="bg-alt px-4 py-8 @2xl:py-12">
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-bold text-navy">ยืนยันการจอง</h1>
        <StepIndicator current={settled ? 5 : 4} />

        {settled ? (
          <div className={`${cardClass} animate-pop-in p-6 text-center`}>
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-3xl text-success">
              <CheckIcon />
            </span>
            <p className="mt-4 text-xl font-bold text-navy">จองสำเร็จ!</p>
            <p className="mt-1 text-sm text-muted">
              {booking.payment_status === "paid"
                ? `ชำระเงินแล้ว ${formatBaht(booking.total)}`
                : `กรุณาชำระ ${formatBaht(booking.total)} ที่เคาน์เตอร์สาขา`}
            </p>
            <div className="mt-6 grid gap-3 @md:grid-cols-2">
              <div className="rounded-2xl bg-highlight p-4">
                <p className="text-xs text-muted">Tracking Code</p>
                <p className="font-mono text-2xl font-bold tracking-wider text-navy">{booking.tracking_code}</p>
              </div>
              <div className="rounded-2xl bg-highlight p-4">
                <p className="text-xs text-muted">Seal Code (ใช้ตอนรับคืน)</p>
                <p className="font-mono text-2xl font-bold tracking-[0.3em] text-navy">{booking.seal_code}</p>
              </div>
            </div>
            {booking.storage_slot ? (
              <p className="mt-3 text-sm text-muted">
                ช่องเก็บกระเป๋า: <span className="font-semibold text-ink">{booking.storage_slot}</span>
              </p>
            ) : null}
            <div className="mt-6 flex flex-col justify-center gap-3 @md:flex-row">
              <Link href={`/track/${booking.tracking_code}`} className={buttonClass("primary")}>
                {booking.service_type === "delivery" ? "ติดตามการจัดส่ง" : "ดูสถานะการฝาก"}
              </Link>
              <Link href="/book" className={buttonClass("secondary")}>
                จองเพิ่ม
              </Link>
            </div>
          </div>
        ) : awaitingStripe ? (
          <PaymentPoller />
        ) : (
          <div className={`${cardClass} p-5 text-sm`}>
            <p className="font-semibold text-ink">การจองนี้ยังไม่ได้ชำระเงิน</p>
            <Link href={`/book/pay/${booking.tracking_code}`} className={buttonClass("primary", "md", "mt-3")}>
              ไปหน้าชำระเงิน
            </Link>
          </div>
        )}

        <BookingDetails booking={booking} />
      </div>
    </div>
  );
}
