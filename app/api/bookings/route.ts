import type { NextRequest } from "next/server";
import { getDiscountRule, jsonError } from "@/lib/booking-server";
import type { BookingRequest, CreateBookingResponse } from "@/lib/booking-request";
import { generateSealCode, generateTrackingCode } from "@/lib/codes";
import { isValidThaiPhone, normalizePhone } from "@/lib/format";
import { isInBangkok } from "@/lib/geo";
import {
  BAG_SIZES,
  isValidBagCounts,
  priceDelivery,
  priceStorage,
  roundDistanceKm,
  type BagCounts,
  type PriceBreakdown,
} from "@/lib/pricing";
import { getRoute } from "@/lib/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatOpeningHours, isWithinOpeningHours } from "@/lib/time";
import type { Branch, Place, RouteGeoJson } from "@/lib/types";

const MAX_STORAGE_DAYS = 30;
const MAX_ADVANCE_DAYS = 30;
const PAST_TOLERANCE_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

class ValidationError extends Error {}

function fail(message: string): never {
  throw new ValidationError(message);
}

function text(value: unknown, label: string, max = 100) {
  if (typeof value !== "string" || value.trim().length < 2) fail(`กรุณากรอก${label}`);
  const trimmed = value.trim();
  if (trimmed.length > max) fail(`${label}ยาวเกินไป`);
  return trimmed;
}

function date(value: unknown, label: string) {
  if (typeof value !== "string") fail(`กรุณาเลือก${label}`);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) fail(`${label}ไม่ถูกต้อง`);
  return parsed;
}

function bags(value: unknown): BagCounts {
  const input = (value ?? {}) as Record<string, unknown>;
  const counts = Object.fromEntries(BAG_SIZES.map((size) => [size, Number(input[size] ?? 0)])) as BagCounts;
  if (!isValidBagCounts(counts)) fail("กรุณาเลือกจำนวนกระเป๋าอย่างน้อย 1 ใบ (สูงสุด 20 ใบต่อขนาด)");
  return counts;
}

function hotel(value: unknown): Place {
  const input = (value ?? {}) as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 200) : "";
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  if (!name) fail("กรุณาเลือกโรงแรม");
  if (!isInBangkok(lat, lng)) fail("โรงแรมต้องอยู่ในเขตกรุงเทพฯ และปริมณฑล");
  return { name, lat, lng };
}

function branchById(branches: Branch[], id: unknown, label: string) {
  const branch = branches.find((b) => b.id === Number(id));
  if (!branch) fail(`กรุณาเลือก${label}`);
  return branch;
}

function assertOpen(branch: Branch, at: Date, label: string) {
  if (!isWithinOpeningHours(branch, at)) {
    fail(`${label}ต้องอยู่ในเวลาเปิดของสาขา ${branch.name} (${formatOpeningHours(branch)})`);
  }
}

function assertUpcoming(at: Date, label: string, now: number) {
  if (at.getTime() < now - PAST_TOLERANCE_MS) fail(`${label}ต้องไม่ใช่เวลาที่ผ่านมาแล้ว`);
  if (at.getTime() > now + MAX_ADVANCE_DAYS * DAY_MS) fail(`${label}จองล่วงหน้าได้ไม่เกิน ${MAX_ADVANCE_DAYS} วัน`);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("กรุณาเข้าสู่ระบบก่อนจอง", 401);

  const body = (await request.json().catch(() => null)) as Partial<BookingRequest> | null;
  if (!body) return jsonError("ข้อมูลไม่ถูกต้อง");

  try {
    const { data: branchRows, error: branchError } = await supabase
      .from("branches")
      .select("id, name, lat, lng, open_time, close_time, phone");
    if (branchError) throw new Error(branchError.message);
    const branches = (branchRows ?? []) as Branch[];
    const now = Date.now();

    const sender = text(body.sender_name, "ชื่อผู้ส่ง");
    const receiver = text(body.receiver_name, "ชื่อผู้รับ");
    const phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");
    if (!isValidThaiPhone(phone)) fail("เบอร์โทรต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0");
    const counts = bags(body.bags);

    const rule = body.discount_code?.trim() ? await getDiscountRule(body.discount_code) : null;
    if (body.discount_code?.trim() && !rule) fail("ไม่พบโค้ดส่วนลดนี้");

    let row: Record<string, unknown>;
    let price: PriceBreakdown;

    if (body.service_type === "storage") {
      const branch = branchById(branches, body.branch_id, "สาขาที่ฝาก");
      const start = date(body.storage_start, "วัน-เวลาฝาก");
      const end = date(body.storage_end, "วัน-เวลารับคืน");
      assertUpcoming(start, "เวลาฝาก", now);
      if (end <= start) fail("เวลารับคืนต้องอยู่หลังเวลาฝาก");
      if (end.getTime() - start.getTime() > MAX_STORAGE_DAYS * DAY_MS) fail(`ฝากได้สูงสุด ${MAX_STORAGE_DAYS} วัน`);
      assertOpen(branch, start, "เวลาฝาก");
      assertOpen(branch, end, "เวลารับคืน");

      price = priceStorage(counts, start, end, rule);
      row = {
        service_type: "storage",
        branch_id: branch.id,
        origin_name: branch.name,
        origin_lat: branch.lat,
        origin_lng: branch.lng,
        storage_start: start.toISOString(),
        storage_end: end.toISOString(),
      };
    } else if (body.service_type === "delivery") {
      const mode = body.delivery_mode;
      let origin: Place;
      let destination: Place;
      let branchId: number;
      const scheduled = date(body.scheduled_at, "วัน-เวลารับกระเป๋า");
      assertUpcoming(scheduled, "เวลารับกระเป๋า", now);

      if (mode === "branch_to_hotel") {
        const from = branchById(branches, body.origin_branch_id, "สาขาต้นทาง");
        assertOpen(from, scheduled, "เวลารับกระเป๋า");
        origin = from;
        destination = hotel(body.hotel);
        branchId = from.id;
      } else if (mode === "hotel_to_branch") {
        const to = branchById(branches, body.destination_branch_id, "สาขาปลายทาง");
        assertOpen(to, scheduled, "เวลารับกระเป๋า");
        origin = hotel(body.hotel);
        destination = to;
        branchId = to.id;
      } else if (mode === "branch_to_branch") {
        const from = branchById(branches, body.origin_branch_id, "สาขาต้นทาง");
        const to = branchById(branches, body.destination_branch_id, "สาขาปลายทาง");
        if (from.id === to.id) fail("สาขาต้นทางและปลายทางต้องไม่ซ้ำกัน");
        assertOpen(from, scheduled, "เวลารับกระเป๋า");
        origin = from;
        destination = to;
        branchId = from.id;
      } else {
        fail("กรุณาเลือกรูปแบบการส่ง");
      }

      const { route, distanceKm } = await getRoute(origin, destination);
      price = priceDelivery(counts, distanceKm, rule);
      row = {
        service_type: "delivery",
        delivery_mode: mode,
        branch_id: branchId,
        origin_name: origin.name,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_name: destination.name,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        scheduled_at: scheduled.toISOString(),
        route_geojson: route satisfies RouteGeoJson,
        distance_km: roundDistanceKm(distanceKm),
      };
    } else {
      fail("กรุณาเลือกบริการ");
    }

    const admin = createAdminClient();
    const base = {
      ...row,
      user_id: user.id,
      sender_name: sender,
      receiver_name: receiver,
      phone,
      subtotal: price.subtotal,
      discount: price.discount,
      total: price.total,
      discount_code: price.discount > 0 && rule ? rule.code : null,
      payment_status: "unpaid",
      status: "pending_payment",
    };

    // Tracking codes are random; retry on the rare unique-constraint collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: booking, error } = await admin
        .from("bookings")
        .insert({ ...base, tracking_code: generateTrackingCode(), seal_code: generateSealCode() })
        .select("id, tracking_code")
        .single<{ id: string; tracking_code: string }>();

      if (error?.code === "23505") continue;
      if (error || !booking) throw new Error(error?.message ?? "บันทึกการจองไม่สำเร็จ");

      const { error: itemsError } = await admin.from("booking_items").insert(
        price.items.map((item) => ({
          booking_id: booking.id,
          size: item.size,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      );
      if (itemsError) {
        await admin.from("bookings").delete().eq("id", booking.id);
        throw new Error(itemsError.message);
      }

      const result: CreateBookingResponse = { tracking_code: booking.tracking_code };
      return Response.json(result, { status: 201 });
    }
    throw new Error("สร้าง Tracking Code ไม่สำเร็จ กรุณาลองใหม่");
  } catch (error) {
    if (error instanceof ValidationError) return jsonError(error.message, 422);
    return jsonError(error instanceof Error ? error.message : "สร้างการจองไม่สำเร็จ", 500);
  }
}
