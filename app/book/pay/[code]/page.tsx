import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PaymentOptions } from "@/app/book/pay/[code]/payment-options";
import { BookingDetails } from "@/components/booking/booking-details";
import { PriceSummary } from "@/components/booking/price-summary";
import { StepIndicator } from "@/components/booking/step-indicator";
import { ErrorState } from "@/components/ui";
import { bookingPriceLines } from "@/lib/booking-view";
import { getMyBooking } from "@/lib/data";
import { PAYMENT_STATUS_LABELS } from "@/lib/status";

export const metadata: Metadata = { title: "ชำระเงิน" };

export default async function PayPage({ params, searchParams }: PageProps<"/book/pay/[code]">) {
  const { code } = await params;
  const { canceled } = await searchParams;
  const { data: booking, error } = await getMyBooking(code);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <ErrorState title="โหลดการจองไม่สำเร็จ" message={error} />
      </div>
    );
  }
  if (!booking) notFound();
  if (booking.payment_status === "paid" || booking.payment_status === "pay_at_counter") {
    redirect(`/book/confirm/${booking.tracking_code}`);
  }

  const notice =
    canceled === "1"
      ? "ยกเลิกการชำระเงินแล้ว เลือกวิธีชำระเงินใหม่ได้เลย"
      : booking.payment_status === "failed" || booking.payment_status === "expired"
        ? `${PAYMENT_STATUS_LABELS[booking.payment_status]} กรุณาชำระเงินอีกครั้ง`
        : null;

  return (
    <div className="bg-alt px-4 py-8 @2xl:py-12">
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-bold text-navy">ชำระเงิน</h1>
        <StepIndicator current={3} />
        {notice ? (
          <p className="rounded-xl bg-highlight px-4 py-3 text-sm text-cta-hover" role="status">
            {notice}
          </p>
        ) : null}
        <BookingDetails booking={booking} />
        <PriceSummary
          lines={bookingPriceLines(booking)}
          subtotal={booking.subtotal}
          discount={booking.discount}
          total={booking.total}
          discountCode={booking.discount_code}
          note="ราคานี้คำนวณโดยเซิร์ฟเวอร์จากเส้นทางและโค้ดส่วนลดที่ใช้งานได้จริง"
        />
        <PaymentOptions code={booking.tracking_code} total={booking.total} />
      </div>
    </div>
  );
}
