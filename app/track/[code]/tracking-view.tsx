"use client";

import Link from "next/link";
import { BookingDetails } from "@/components/booking/booking-details";
import { StatusTimeline } from "@/components/booking/status-timeline";
import { ClockIcon, NavigationIcon, QrCodeIcon } from "@/components/icons";
import { TrackingMap } from "@/components/map/lazy-map";
import type { MapPoint } from "@/components/map/tracking-map";
import { buttonClass, cardClass } from "@/components/ui";
import { pointAlong } from "@/lib/geo";
import { useDriverLocation, useLiveBooking, useNow, useStatusSync } from "@/lib/hooks";
import { deliveryProgress, travelSeconds } from "@/lib/simulation";
import { isFinished, STATUS_LABELS } from "@/lib/status";
import { formatDateTime } from "@/lib/time";
import type { BookingWithItems } from "@/lib/types";

/** A driver position older than this is ignored and the simulated vehicle is shown instead. */
const LIVE_STALE_MS = 30_000;

function formatCountdown(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes > 0 ? `${minutes} นาที ${rest} วินาที` : `${rest} วินาที`;
}

export function TrackingView({ initialBooking, serverNow }: { initialBooking: BookingWithItems; serverNow: number }) {
  const [booking] = useLiveBooking(initialBooking);
  const active = !isFinished(booking.status) && booking.status !== "pending_payment";
  const now = useNow(serverNow, 1000, active);
  const driver = useDriverLocation(booking.id);
  useStatusSync(active);

  const isDelivery = booking.service_type === "delivery";
  const progress = deliveryProgress(booking, now);
  const route = booking.route_geojson?.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]) ?? [];

  const liveFresh = driver !== null && now - new Date(driver.updated_at).getTime() < LIVE_STALE_MS;
  let vehicle: { lat: number; lng: number; live: boolean } | null = null;
  if (isDelivery && booking.status !== "pending_payment" && booking.status !== "delivered") {
    if (liveFresh && driver) {
      vehicle = { lat: driver.lat, lng: driver.lng, live: true };
    } else if (booking.route_geojson) {
      const [lat, lng] = pointAlong(booking.route_geojson, progress.fraction);
      vehicle = { lat, lng, live: false };
    }
  }

  const points: (MapPoint & { kind: "origin" | "destination" | "branch" })[] = [];
  if (booking.origin_lat != null && booking.origin_lng != null) {
    points.push({
      kind: isDelivery ? "origin" : "branch",
      lat: booking.origin_lat,
      lng: booking.origin_lng,
      label: booking.origin_name ?? "ต้นทาง",
    });
  }
  if (isDelivery && booking.destination_lat != null && booking.destination_lng != null) {
    points.push({
      kind: "destination",
      lat: booking.destination_lat,
      lng: booking.destination_lng,
      label: booking.destination_name ?? "ปลายทาง",
    });
  }

  return (
    <div className="bg-alt px-4 py-8 @2xl:py-12">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted">ติดตามสถานะ</p>
            <h1 className="font-mono text-2xl font-bold text-navy">{booking.tracking_code}</h1>
          </div>
          {vehicle?.live ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-cta-hover">
              <span className="size-2 animate-pulse rounded-full bg-cta" /> Live Driver
            </span>
          ) : null}
        </div>

        <div className={`${cardClass} space-y-4 p-5`}>
          <StatusTimeline service={booking.service_type} status={booking.status} />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4 text-sm" aria-live="polite">
            <p className="font-semibold text-ink">{STATUS_LABELS[booking.status]}</p>
            {isDelivery && active ? (
              <p className="flex items-center gap-1.5 text-muted">
                <ClockIcon />
                {booking.status === "picked_up" ? "รถจะออกเดินทางใน " : "ถึงปลายทางในอีกประมาณ "}
                <span className="font-semibold text-ink tabular-nums">
                  {formatCountdown(
                    booking.status === "picked_up"
                      ? progress.secondsRemaining - travelSeconds(booking.distance_km)
                      : progress.secondsRemaining,
                  )}
                </span>
              </p>
            ) : null}
            {booking.service_type === "storage" && booking.storage_end && active ? (
              <p className="flex items-center gap-1.5 text-muted">
                <ClockIcon /> นัดรับคืน {formatDateTime(booking.storage_end)}
              </p>
            ) : null}
            {booking.status === "pending_payment" ? (
              <Link href={`/book/pay/${booking.tracking_code}`} className={buttonClass("primary", "sm")}>
                ชำระเงิน
              </Link>
            ) : null}
          </div>
        </div>

        <TrackingMap route={isDelivery ? route : []} points={points} vehicle={vehicle} className="h-80 @2xl:h-96" />

        {isDelivery && active ? (
          <p className="text-xs text-muted">
            ตำแหน่งรถเป็นการจำลองตามเส้นทางจริงจาก OSRM — เปิด{" "}
            <Link href="/driver" className="font-semibold text-navy underline-offset-4 hover:underline">
              Live Driver Mode
            </Link>{" "}
            บนมือถืออีกเครื่องเพื่อแชร์ตำแหน่งจริงแบบเรียลไทม์
          </p>
        ) : null}

        <div className="grid gap-5 @2xl:grid-cols-[1fr_auto]">
          <BookingDetails booking={booking} />
          <div className={`${cardClass} flex flex-col gap-3 p-5 @2xl:w-56`}>
            <p className="text-xs text-muted">Seal Code</p>
            <p className="font-mono text-2xl font-bold tracking-[0.3em] text-navy">{booking.seal_code}</p>
            {booking.service_type === "storage" ? (
              <Link href={`/retrieve?code=${booking.tracking_code}`} className={buttonClass("secondary", "sm")}>
                <QrCodeIcon /> รับคืนกระเป๋า
              </Link>
            ) : (
              <Link href="/driver" className={buttonClass("secondary", "sm")}>
                <NavigationIcon /> Driver Mode
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
