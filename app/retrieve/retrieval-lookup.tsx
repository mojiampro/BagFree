"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, type FormEvent } from "react";
import { BookingDetails } from "@/components/booking/booking-details";
import { CheckIcon, KeyIcon, SearchIcon, Spinner } from "@/components/icons";
import { buttonClass, cardClass, EmptyState, ErrorState, inputClass } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { BookingWithItems } from "@/lib/types";

type Lookup =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found"; booking: BookingWithItems }
  | { state: "not_found"; query: string }
  | { state: "error"; message: string };

const TRACKING_PATTERN = /^BF-[A-Z0-9]{6}$/;
const SEAL_PATTERN = /^\d{6}$/;

async function findBooking(query: string): Promise<Lookup> {
  const supabase = createClient();
  const column = TRACKING_PATTERN.test(query) ? "tracking_code" : "seal_code";
  // RLS limits the search to the signed-in user's own bookings.
  const { data, error } = await supabase
    .from("bookings")
    .select("*, booking_items(*)")
    .eq(column, query)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<BookingWithItems[]>();
  if (error) return { state: "error", message: error.message };
  const booking = data?.[0];
  if (!booking) return { state: "not_found", query };
  return {
    state: "found",
    booking: {
      ...booking,
      subtotal: Number(booking.subtotal),
      discount: Number(booking.discount),
      total: Number(booking.total),
      distance_km: booking.distance_km == null ? null : Number(booking.distance_km),
    },
  };
}

export function RetrievalLookup({ initialCode }: { initialCode: string }) {
  const [query, setQuery] = useState(initialCode);
  const [formError, setFormError] = useState<string | null>(null);
  const [lookup, setLookup] = useState<Lookup>(initialCode ? { state: "loading" } : { state: "idle" });
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialCode) return;
    let active = true;
    findBooking(initialCode).then((result) => {
      if (active) setLookup(result);
    });
    return () => {
      active = false;
    };
  }, [initialCode]);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim().toUpperCase();
    if (!TRACKING_PATTERN.test(value) && !SEAL_PATTERN.test(value)) {
      setFormError("กรอก Tracking Code รูปแบบ BF-XXXXXX หรือ Seal Code ตัวเลข 6 หลัก");
      return;
    }
    setFormError(null);
    setConfirmError(null);
    setLookup({ state: "loading" });
    setLookup(await findBooking(value));
  }

  async function confirmRetrieval(booking: BookingWithItems) {
    setConfirming(true);
    setConfirmError(null);
    try {
      const response = await fetch(`/api/bookings/${booking.tracking_code}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_retrieval", seal_code: booking.seal_code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "ยืนยันไม่สำเร็จ");
      setLookup({ state: "found", booking: { ...booking, status: "retrieved" } });
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : "ยืนยันไม่สำเร็จ");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={search} className={`${cardClass} space-y-3 p-5`} noValidate>
        <label htmlFor="retrieve-code" className="text-sm font-medium text-ink">
          Tracking Code หรือ Seal Code
        </label>
        <div className="flex gap-2">
          <input
            id="retrieve-code"
            className={`${inputClass} font-mono uppercase`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="BF-7K2M9Q หรือ 123456"
            aria-invalid={!!formError}
            autoComplete="off"
          />
          <button type="submit" className={buttonClass("primary", "md", "shrink-0")} disabled={lookup.state === "loading"}>
            {lookup.state === "loading" ? <Spinner /> : <SearchIcon />} ค้นหา
          </button>
        </div>
        {formError ? <p className="text-xs text-danger">{formError}</p> : null}
      </form>

      {lookup.state === "loading" ? (
        <div className={`${cardClass} flex items-center justify-center gap-3 p-10 text-muted`}>
          <Spinner className="text-2xl text-navy" /> กำลังค้นหา...
        </div>
      ) : null}
      {lookup.state === "error" ? <ErrorState title="ค้นหาไม่สำเร็จ" message={lookup.message} /> : null}
      {lookup.state === "not_found" ? (
        <EmptyState icon={<SearchIcon />} title="ไม่พบการจอง" message={`ไม่พบ ${lookup.query} ในการจองของบัญชีนี้`} />
      ) : null}
      {lookup.state === "idle" ? (
        <EmptyState icon={<KeyIcon />} title="ค้นหาการจองเพื่อรับคืน" message="Tracking Code และ Seal Code อยู่ในหน้ายืนยันการจองและแดชบอร์ด" />
      ) : null}

      {lookup.state === "found" ? (
        <>
          {lookup.booking.status === "retrieved" ? (
            <div className={`${cardClass} animate-pop-in p-6 text-center`}>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-2xl text-success">
                <CheckIcon />
              </span>
              <p className="mt-3 text-lg font-bold text-navy">รับคืนกระเป๋าเรียบร้อย</p>
              <p className="text-sm text-muted">ขอบคุณที่ใช้บริการ Bag Free</p>
            </div>
          ) : (
            <div className={`${cardClass} flex flex-col items-center gap-4 p-6 text-center`}>
              <p className="text-sm text-muted">แสดง QR Code นี้ให้เจ้าหน้าที่สแกน</p>
              <div className="rounded-2xl border border-line bg-white p-4">
                <QRCodeSVG
                  value={JSON.stringify({ tracking: lookup.booking.tracking_code, seal: lookup.booking.seal_code })}
                  size={196}
                  level="M"
                  marginSize={0}
                />
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-navy">{lookup.booking.tracking_code}</p>
                <p className="font-mono text-sm tracking-[0.3em] text-muted">Seal {lookup.booking.seal_code}</p>
              </div>

              {lookup.booking.service_type === "storage" ? (
                lookup.booking.status === "stored" || lookup.booking.status === "ready_for_pickup" ? (
                  <div className="w-full space-y-2 border-t border-dashed border-line pt-4">
                    <p className="text-xs text-muted">สำหรับเจ้าหน้าที่ (จำลอง)</p>
                    <button
                      type="button"
                      onClick={() => confirmRetrieval(lookup.booking)}
                      disabled={confirming}
                      className={buttonClass("primary", "md", "w-full")}
                    >
                      {confirming ? <Spinner /> : <CheckIcon />} ยืนยันรับคืนกระเป๋า
                    </button>
                    {confirmError ? <p className="text-xs text-danger">{confirmError}</p> : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted">ยังรับคืนไม่ได้ — กรุณาชำระเงินให้เรียบร้อยก่อน</p>
                )
              ) : (
                <Link href={`/track/${lookup.booking.tracking_code}`} className={buttonClass("secondary", "sm")}>
                  ดูสถานะการจัดส่ง
                </Link>
              )}
            </div>
          )}
          <BookingDetails booking={lookup.booking} />
        </>
      ) : null}
    </div>
  );
}
