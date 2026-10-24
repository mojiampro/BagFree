import type { NextRequest } from "next/server";
import { getDiscountRule, jsonError } from "@/lib/booking-server";
import type { DiscountResponse } from "@/lib/booking-request";
import { computeDiscount, describeDiscount } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/supabase/server";

/** Preview a discount code against a subtotal. The real discount is recomputed when booking. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("กรุณาเข้าสู่ระบบ", 401);

  const body = (await request.json().catch(() => null)) as { code?: unknown; subtotal?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";
  const subtotal = typeof body?.subtotal === "number" && body.subtotal >= 0 ? body.subtotal : 0;

  try {
    const rule = await getDiscountRule(code);
    if (!rule) return jsonError("ไม่พบโค้ดส่วนลดนี้", 404);
    if (subtotal < rule.min_total) {
      return jsonError(`โค้ด ${rule.code} ใช้ได้เมื่อยอดขั้นต่ำ ${rule.min_total} ฿`, 422);
    }
    const result: DiscountResponse = {
      code: rule.code,
      discount: computeDiscount(subtotal, rule),
      description: describeDiscount(rule),
    };
    return Response.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "ตรวจสอบโค้ดไม่สำเร็จ", 500);
  }
}
