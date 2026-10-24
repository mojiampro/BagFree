import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Branch, BookingWithItems, PublicReview } from "@/lib/types";

export type Result<T> = { data: T; error: null } | { data: null; error: string };

function failure(error: unknown): { data: null; error: string } {
  return { data: null, error: error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลได้" };
}

export async function getBranches(): Promise<Result<Branch[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("branches")
      .select("id, name, lat, lng, open_time, close_time, phone")
      .order("id");
    if (error) return failure(new Error(error.message));
    return { data: data as Branch[], error: null };
  } catch (error) {
    return failure(error);
  }
}

export async function getLatestReviews(limit = 6): Promise<Result<PublicReview[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("latest_reviews", { max_rows: limit });
    if (error) return failure(new Error(error.message));
    return {
      data: (data as PublicReview[]).map((review) => ({ ...review, rating: Number(review.rating) })),
      error: null,
    };
  } catch (error) {
    return failure(error);
  }
}

const BOOKING_COLUMNS = "*, booking_items(*)";

function normalizeBooking(row: BookingWithItems): BookingWithItems {
  return {
    ...row,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    total: Number(row.total),
    distance_km: row.distance_km == null ? null : Number(row.distance_km),
    booking_items: (row.booking_items ?? []).map((item) => ({
      ...item,
      unit_price: Number(item.unit_price),
    })),
  };
}

/** A booking of the signed-in user by tracking code (RLS hides everyone else's). */
export async function getMyBooking(trackingCode: string): Promise<Result<BookingWithItems | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_COLUMNS)
      .eq("tracking_code", trackingCode.toUpperCase())
      .maybeSingle<BookingWithItems>();
    if (error) return failure(new Error(error.message));
    return { data: data ? normalizeBooking(data) : null, error: null };
  } catch (error) {
    return failure(error);
  }
}

export async function getMyBookings(): Promise<Result<BookingWithItems[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_COLUMNS)
      .order("created_at", { ascending: false })
      .returns<BookingWithItems[]>();
    if (error) return failure(new Error(error.message));
    return { data: (data ?? []).map(normalizeBooking), error: null };
  } catch (error) {
    return failure(error);
  }
}
