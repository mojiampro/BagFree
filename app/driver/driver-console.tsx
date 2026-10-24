"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, NavigationIcon, Spinner, TruckIcon } from "@/components/icons";
import { TrackingMap } from "@/components/map/lazy-map";
import { buttonClass, cardClass, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { STATUS_LABELS } from "@/lib/status";
import type { BookingWithItems } from "@/lib/types";

/** Minimum gap between position writes, to stay friendly to the realtime quota. */
const SEND_INTERVAL_MS = 3000;

type Sharing =
  | { state: "idle" }
  | { state: "locating" }
  | { state: "sharing"; lat: number; lng: number; accuracy: number; sentAt: number }
  | { state: "error"; message: string };

const GEO_ERRORS: Record<number, string> = {
  1: "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง กรุณาอนุญาต Location ในเบราว์เซอร์",
  2: "ไม่สามารถระบุตำแหน่งได้ในขณะนี้",
  3: "หมดเวลาระบุตำแหน่ง ลองใหม่อีกครั้ง",
};

export function DriverConsole({ deliveries }: { deliveries: BookingWithItems[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(deliveries[0]?.id ?? null);
  const [sharing, setSharing] = useState<Sharing>({ state: "idle" });
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastSent = useRef(0);

  const selected = deliveries.find((booking) => booking.id === selectedId) ?? deliveries[0] ?? null;

  function stop() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setSharing({ state: "idle" });
  }

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  function start() {
    if (!selected) return;
    if (!("geolocation" in navigator)) {
      setSharing({ state: "error", message: "อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง" });
      return;
    }
    setMessage(null);
    setSharing({ state: "locating" });
    const supabase = createClient();
    const bookingId = selected.id;
    lastSent.current = 0;

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        const nowMs = Date.now();
        if (nowMs - lastSent.current < SEND_INTERVAL_MS) return;
        lastSent.current = nowMs;
        const { error } = await supabase
          .from("driver_locations")
          .upsert({ booking_id: bookingId, lat, lng, updated_at: new Date().toISOString() }, { onConflict: "booking_id" });
        if (error) setSharing({ state: "error", message: `ส่งตำแหน่งไม่สำเร็จ: ${error.message}` });
        else setSharing({ state: "sharing", lat, lng, accuracy, sentAt: nowMs });
      },
      (error) => {
        setSharing({ state: "error", message: GEO_ERRORS[error.code] ?? error.message });
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
  }

  async function completeDelivery() {
    if (!selected) return;
    setCompleting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/bookings/${selected.tracking_code}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_delivery" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "อัปเดตสถานะไม่สำเร็จ");
      stop();
      setMessage(`ส่ง ${selected.tracking_code} ถึงปลายทางเรียบร้อย`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setCompleting(false);
    }
  }

  if (deliveries.length === 0) {
    return (
      <>
        {message ? <p className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">{message}</p> : null}
        <EmptyState
          icon={<TruckIcon />}
          title="ไม่มีงานส่งที่กำลังดำเนินการ"
          message="งานจะปรากฏที่นี่เมื่อมีการจองส่งกระเป๋าที่ชำระเงินแล้วและยังส่งไม่ถึง"
          action={
            <Link href="/book?service=delivery" className={buttonClass("primary", "sm")}>
              จองส่งกระเป๋า
            </Link>
          }
        />
      </>
    );
  }

  const isSharing = sharing.state === "sharing" || sharing.state === "locating";

  return (
    <div className="space-y-5">
      <div className={`${cardClass} space-y-3 p-5`}>
        <label htmlFor="driver-job" className="text-sm font-medium text-ink">
          เลือกงานส่ง
        </label>
        <select
          id="driver-job"
          className="h-11 w-full rounded-xl border border-line bg-white px-4 text-sm"
          value={selected?.id ?? ""}
          disabled={isSharing}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {deliveries.map((booking) => (
            <option key={booking.id} value={booking.id}>
              {booking.tracking_code} · {booking.origin_name} → {booking.destination_name} ({STATUS_LABELS[booking.status]})
            </option>
          ))}
        </select>
        {selected ? (
          <p className="text-xs text-muted">
            ปลายทาง: <span className="font-medium text-ink">{selected.destination_name}</span>
          </p>
        ) : null}
      </div>

      <div className={`${cardClass} space-y-4 p-5`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`size-3 rounded-full ${
                sharing.state === "sharing" ? "animate-pulse bg-success" : sharing.state === "error" ? "bg-danger" : "bg-line"
              }`}
            />
            <p className="text-sm font-semibold text-ink">
              {sharing.state === "sharing"
                ? "กำลังแชร์ตำแหน่ง"
                : sharing.state === "locating"
                  ? "กำลังค้นหาตำแหน่ง..."
                  : sharing.state === "error"
                    ? "เกิดข้อผิดพลาด"
                    : "ยังไม่ได้แชร์ตำแหน่ง"}
            </p>
          </div>
          {isSharing ? (
            <button type="button" onClick={stop} className={buttonClass("danger", "sm")}>
              หยุดแชร์
            </button>
          ) : (
            <button type="button" onClick={start} className={buttonClass("primary", "sm")} disabled={!selected}>
              <NavigationIcon /> เริ่มแชร์ตำแหน่ง
            </button>
          )}
        </div>

        {sharing.state === "error" ? <p className="text-sm text-danger">{sharing.message}</p> : null}
        {sharing.state === "locating" ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Spinner /> รอสัญญาณ GPS...
          </p>
        ) : null}
        {sharing.state === "sharing" ? (
          <>
            <p className="text-xs text-muted tabular-nums">
              {sharing.lat.toFixed(5)}, {sharing.lng.toFixed(5)} · แม่นยำ ±{Math.round(sharing.accuracy)} ม.
            </p>
            <TrackingMap
              vehicle={{ lat: sharing.lat, lng: sharing.lng, live: true }}
              points={
                selected?.destination_lat != null && selected.destination_lng != null
                  ? [{ kind: "destination", lat: selected.destination_lat, lng: selected.destination_lng, label: selected.destination_name ?? "ปลายทาง" }]
                  : []
              }
              follow
              className="h-64"
            />
          </>
        ) : null}
      </div>

      {message ? (
        <p className="rounded-xl bg-highlight px-4 py-3 text-sm text-cta-hover" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 @md:flex-row">
        <button type="button" onClick={completeDelivery} disabled={!selected || completing} className={buttonClass("secondary", "md", "flex-1")}>
          {completing ? <Spinner /> : <CheckIcon />} ยืนยันส่งถึงปลายทาง
        </button>
        {selected ? (
          <Link href={`/track/${selected.tracking_code}`} className={buttonClass("ghost", "md", "flex-1")}>
            เปิดหน้าติดตาม
          </Link>
        ) : null}
      </div>
    </div>
  );
}
