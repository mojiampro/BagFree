import type { Booking, BookingStatus } from "@/lib/types";

/**
 * Demo timeline for a paid delivery, measured from `started_at`:
 * picked_up → (PICKUP_SECONDS) → in_transit → (travel time) → delivered.
 * Shared by the tracking map (vehicle position) and the server status sync.
 */
export const PICKUP_SECONDS = 20;
const MIN_TRAVEL_SECONDS = 60;
const MAX_TRAVEL_SECONDS = 240;
const SECONDS_PER_KM = 8;

/** Storage becomes "ready for pickup" this long before the booked pickup time. */
export const READY_BEFORE_END_MS = 60 * 60 * 1000;

export function travelSeconds(distanceKm: number | null) {
  const seconds = Math.round((distanceKm ?? 5) * SECONDS_PER_KM);
  return Math.min(MAX_TRAVEL_SECONDS, Math.max(MIN_TRAVEL_SECONDS, seconds));
}

export interface DeliveryProgress {
  status: BookingStatus;
  /** 0–1 along the route. */
  fraction: number;
  secondsRemaining: number;
}

export function deliveryProgress(
  booking: Pick<Booking, "started_at" | "distance_km" | "status">,
  now = Date.now(),
): DeliveryProgress {
  const travel = travelSeconds(booking.distance_km);
  if (booking.status === "delivered") return { status: "delivered", fraction: 1, secondsRemaining: 0 };
  if (!booking.started_at || booking.status === "pending_payment") {
    return { status: "pending_payment", fraction: 0, secondsRemaining: PICKUP_SECONDS + travel };
  }
  const elapsed = (now - new Date(booking.started_at).getTime()) / 1000;
  if (elapsed < PICKUP_SECONDS) {
    return { status: "picked_up", fraction: 0, secondsRemaining: PICKUP_SECONDS + travel - elapsed };
  }
  const travelled = elapsed - PICKUP_SECONDS;
  if (travelled < travel) {
    return { status: "in_transit", fraction: travelled / travel, secondsRemaining: travel - travelled };
  }
  return { status: "delivered", fraction: 1, secondsRemaining: 0 };
}

/** Status a booking should have right now according to the demo timeline (never moves backwards). */
export function expectedStatus(
  booking: Pick<Booking, "service_type" | "status" | "started_at" | "distance_km" | "storage_end">,
  now = Date.now(),
): BookingStatus {
  if (booking.status === "pending_payment" || booking.status === "delivered" || booking.status === "retrieved") {
    return booking.status;
  }
  if (booking.service_type === "delivery") {
    const next = deliveryProgress(booking, now).status;
    const order: BookingStatus[] = ["picked_up", "in_transit", "delivered"];
    return order.indexOf(next) > order.indexOf(booking.status) ? next : booking.status;
  }
  if (
    booking.status === "stored" &&
    booking.storage_end &&
    now >= new Date(booking.storage_end).getTime() - READY_BEFORE_END_MS
  ) {
    return "ready_for_pickup";
  }
  return booking.status;
}

export function firstActiveStatus(serviceType: Booking["service_type"]): BookingStatus {
  return serviceType === "delivery" ? "picked_up" : "stored";
}
