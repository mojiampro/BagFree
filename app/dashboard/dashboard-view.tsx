"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/booking/booking-details";
import { LuggageIcon, MapPinIcon, QrCodeIcon, TruckIcon } from "@/components/icons";
import { useAuth } from "@/components/providers/auth-provider";
import { useNotifications } from "@/components/providers/notifications-provider";
import { buttonClass, cardClass, EmptyState } from "@/components/ui";
import { bookingRouteLabel } from "@/lib/booking-view";
import { formatBaht } from "@/lib/format";
import { useStatusSync } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import { isFinished, PAYMENT_STATUS_LABELS, SERVICE_LABELS } from "@/lib/status";
import { formatDateTime } from "@/lib/time";
import type { Booking, BookingWithItems } from "@/lib/types";

type Tab = "active" | "history";

function BookingCard({ booking, reviewed, onReview }: { booking: BookingWithItems; reviewed: boolean; onReview: () => void }) {
  const Icon = booking.service_type === "delivery" ? TruckIcon : LuggageIcon;
  const bags = booking.booking_items.reduce((sum, item) => sum + item.quantity, 0);
  const finished = isFinished(booking.status);

  return (
    <article className={`${cardClass} animate-pop-in p-5 transition hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy-soft text-xl text-navy">
          <Icon />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono font-bold text-navy">{booking.tracking_code}</p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-0.5 text-sm text-ink">
            {SERVICE_LABELS[booking.service_type]} · {bags} ใบ
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-muted">
            <MapPinIcon className="mt-0.5 shrink-0" />
            <span className="break-words">{bookingRouteLabel(booking)}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold text-ink">{formatBaht(booking.total)}</p>
          <p className="text-[11px] text-muted">{PAYMENT_STATUS_LABELS[booking.payment_status]}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <p className="text-xs text-muted">จองเมื่อ {formatDateTime(booking.created_at)}</p>
        <div className="flex flex-wrap gap-2">
          {booking.status === "pending_payment" ? (
            <Link href={`/book/pay/${booking.tracking_code}`} className={buttonClass("primary", "sm")}>
              ชำระเงิน
            </Link>
          ) : null}
          {booking.service_type === "storage" && (booking.status === "stored" || booking.status === "ready_for_pickup") ? (
            <Link href={`/retrieve?code=${booking.tracking_code}`} className={buttonClass("secondary", "sm")}>
              <QrCodeIcon /> รับคืน
            </Link>
          ) : null}
          {finished && !reviewed ? (
            <button type="button" onClick={onReview} className={buttonClass("primary", "sm")}>
              รีวิว
            </button>
          ) : null}
          {finished && reviewed ? <span className="self-center text-xs text-success">รีวิวแล้ว ✓</span> : null}
          <Link href={`/track/${booking.tracking_code}`} className={buttonClass("ghost", "sm")}>
            รายละเอียด
          </Link>
        </div>
      </div>
    </article>
  );
}

export function DashboardView({ initialBookings }: { initialBookings: BookingWithItems[] }) {
  const { user } = useAuth();
  const { reviewedIds, openReview, promptPendingReview } = useNotifications();
  const [bookings, setBookings] = useState(initialBookings);
  const [tab, setTab] = useState<Tab>("active");
  const userId = user?.id ?? null;

  const active = bookings.filter((booking) => !isFinished(booking.status));
  const history = bookings.filter((booking) => isFinished(booking.status));
  useStatusSync(active.some((booking) => booking.status !== "pending_payment"), 5000);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `user_id=eq.${userId}` },
        (payload) => {
          const next = payload.new as Booking;
          setBookings((list) => list.map((booking) => (booking.id === next.id ? { ...booking, ...next, total: Number(next.total) } : booking)));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const finishedTargets = useMemo(
    () =>
      bookings
        .filter((booking) => isFinished(booking.status))
        .map(({ id, tracking_code, service_type }) => ({ id, tracking_code, service_type })),
    [bookings],
  );
  useEffect(() => {
    if (finishedTargets.length > 0) promptPendingReview(finishedTargets);
  }, [finishedTargets, promptPendingReview]);

  const list = tab === "active" ? active : history;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-white p-1 shadow-sm" role="tablist" aria-label="การจอง">
          {(
            [
              { value: "active", label: "กำลังดำเนินการ", count: active.length },
              { value: "history", label: "ประวัติ", count: history.length },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={tab === option.value}
              onClick={() => setTab(option.value)}
              className={`flex h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
                tab === option.value ? "bg-navy text-white" : "text-muted hover:text-navy"
              }`}
            >
              {option.label}
              <span
                className={`rounded-full px-1.5 text-xs ${tab === option.value ? "bg-white/20" : "bg-alt"}`}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>
        <Link href="/book" className={buttonClass("primary", "sm")}>
          + จองใหม่
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={tab === "active" ? <TruckIcon /> : <LuggageIcon />}
          title={tab === "active" ? "ไม่มีการจองที่กำลังดำเนินการ" : "ยังไม่มีประวัติการใช้บริการ"}
          message={tab === "active" ? "เริ่มจองส่งหรือฝากกระเป๋าได้เลย" : "การจองที่เสร็จสิ้นแล้วจะแสดงที่นี่"}
          action={
            tab === "active" ? (
              <Link href="/book" className={buttonClass("primary", "sm")}>
                จองบริการ
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          {list.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              reviewed={reviewedIds.has(booking.id)}
              onReview={() => openReview({ id: booking.id, tracking_code: booking.tracking_code, service_type: booking.service_type })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
