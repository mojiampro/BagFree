import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/booking-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingStatus } from "@/lib/types";

type Action = "confirm_retrieval" | "confirm_delivery";

/**
 * Simulated staff/driver actions for the demo. Only the booking owner can trigger them,
 * and only from the statuses where the action makes sense.
 */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/bookings/[code]/status">) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("กรุณาเข้าสู่ระบบ", 401);

  const body = (await request.json().catch(() => null)) as { action?: Action; seal_code?: string } | null;

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, service_type, status, seal_code")
    .eq("tracking_code", code.toUpperCase())
    .maybeSingle<Pick<Booking, "id" | "service_type" | "status" | "seal_code">>();
  if (!booking) return jsonError("ไม่พบการจอง", 404);

  let from: BookingStatus[];
  let to: BookingStatus;

  if (body?.action === "confirm_retrieval") {
    if (booking.service_type !== "storage") return jsonError("การจองนี้ไม่ใช่บริการฝากกระเป๋า");
    if (body.seal_code !== booking.seal_code) return jsonError("Seal Code ไม่ถูกต้อง", 403);
    from = ["stored", "ready_for_pickup"];
    to = "retrieved";
  } else if (body?.action === "confirm_delivery") {
    if (booking.service_type !== "delivery") return jsonError("การจองนี้ไม่ใช่บริการส่งกระเป๋า");
    from = ["picked_up", "in_transit"];
    to = "delivered";
  } else {
    return jsonError("คำสั่งไม่ถูกต้อง");
  }

  if (!from.includes(booking.status)) {
    return jsonError(booking.status === to ? "ดำเนินการนี้ไปแล้ว" : "สถานะปัจจุบันยังทำรายการนี้ไม่ได้", 409);
  }

  const { error } = await createAdminClient()
    .from("bookings")
    .update({ status: to })
    .eq("id", booking.id)
    .in("status", from);
  if (error) return jsonError(error.message, 500);

  return Response.json({ status: to });
}
