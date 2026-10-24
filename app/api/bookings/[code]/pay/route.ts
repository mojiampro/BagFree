import type { NextRequest } from "next/server";
import { activateBooking, jsonError } from "@/lib/booking-server";
import { toSatang } from "@/lib/pricing";
import { SERVICE_LABELS } from "@/lib/status";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Booking, PaymentMethod } from "@/lib/types";

const METHODS: PaymentMethod[] = ["card", "promptpay", "cash"];

export async function POST(request: NextRequest, { params }: RouteContext<"/api/bookings/[code]/pay">) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("กรุณาเข้าสู่ระบบ", 401);

  const body = (await request.json().catch(() => null)) as { method?: unknown } | null;
  const method = METHODS.find((m) => m === body?.method);
  if (!method) return jsonError("กรุณาเลือกวิธีชำระเงิน");

  // RLS: only the owner can read this booking.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, service_type, tracking_code, total, payment_status, status")
    .eq("tracking_code", code)
    .maybeSingle<Pick<Booking, "id" | "service_type" | "tracking_code" | "total" | "payment_status" | "status">>();
  if (!booking) return jsonError("ไม่พบการจอง", 404);
  if (booking.payment_status === "paid" || booking.payment_status === "pay_at_counter") {
    return jsonError("การจองนี้ชำระเงินแล้ว", 409);
  }

  try {
    const admin = createAdminClient();

    if (method === "cash") {
      const { error } = await admin.from("bookings").update({ payment_method: "cash" }).eq("id", booking.id);
      if (error) throw new Error(error.message);
      await activateBooking(booking.id, "pay_at_counter");
      return Response.json({ redirect: `/book/confirm/${booking.tracking_code}` });
    }

    const origin = request.nextUrl.origin;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      currency: "thb",
      allowed_payment_method_types: [method],
      client_reference_id: booking.id,
      customer_email: user.email,
      metadata: { booking_id: booking.id, tracking_code: booking.tracking_code },
      payment_intent_data: { metadata: { booking_id: booking.id } },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "thb",
            unit_amount: toSatang(Number(booking.total)),
            product_data: {
              name: `Bag Free — ${SERVICE_LABELS[booking.service_type]}`,
              description: `Tracking Code ${booking.tracking_code}`,
            },
          },
        },
      ],
      success_url: `${origin}/book/confirm/${booking.tracking_code}?paid=1`,
      cancel_url: `${origin}/book/pay/${booking.tracking_code}?canceled=1`,
    });

    const { error } = await admin
      .from("bookings")
      .update({ payment_method: method, payment_status: "unpaid" })
      .eq("id", booking.id);
    if (error) throw new Error(error.message);

    if (!session.url) throw new Error("Stripe ไม่ได้ส่งลิงก์ชำระเงินกลับมา");
    return Response.json({ redirect: session.url });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "เริ่มการชำระเงินไม่สำเร็จ", 502);
  }
}
