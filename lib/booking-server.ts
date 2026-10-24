import "server-only";
import { generateStorageSlot } from "@/lib/codes";
import { firstActiveStatus } from "@/lib/simulation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DiscountRule } from "@/lib/pricing";
import type { Booking, PaymentStatus } from "@/lib/types";

/**
 * Starts the service once payment is settled (Stripe webhook) or deferred to the counter (cash).
 * Idempotent: a booking that already left `pending_payment` keeps its status and start time.
 */
export async function activateBooking(bookingId: string, paymentStatus: Extract<PaymentStatus, "paid" | "pay_at_counter">) {
  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select("id, service_type, status, storage_slot")
    .eq("id", bookingId)
    .single<Pick<Booking, "id" | "service_type" | "status" | "storage_slot">>();
  if (error || !booking) throw new Error(error?.message ?? "ไม่พบการจอง");

  const update: Partial<Booking> = { payment_status: paymentStatus };
  if (booking.status === "pending_payment") {
    update.status = firstActiveStatus(booking.service_type);
    update.started_at = new Date().toISOString();
    if (booking.service_type === "storage" && !booking.storage_slot) update.storage_slot = generateStorageSlot();
  }

  const { error: updateError } = await admin.from("bookings").update(update).eq("id", bookingId);
  if (updateError) throw new Error(updateError.message);
}

export async function setPaymentStatus(bookingId: string, paymentStatus: Extract<PaymentStatus, "failed" | "expired">) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("bookings")
    .update({ payment_status: paymentStatus })
    .eq("id", bookingId)
    .eq("payment_status", "unpaid");
  if (error) throw new Error(error.message);
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function getDiscountRule(code: string): Promise<DiscountRule | null> {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,20}$/.test(normalized)) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("discount_codes")
    .select("code, type, value, min_total, max_discount")
    .eq("code", normalized)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    code: data.code,
    type: data.type,
    value: Number(data.value),
    min_total: Number(data.min_total),
    max_discount: data.max_discount == null ? null : Number(data.max_discount),
  };
}
