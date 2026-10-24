"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BellIcon, XIcon } from "@/components/icons";
import { ReviewModal, type ReviewTarget } from "@/components/review/review-modal";
import { useStatusSync } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import { FINISHED_STATUSES, STATUS_LABELS } from "@/lib/status";
import type { Booking } from "@/lib/types";

export interface AppNotification {
  id: string;
  bookingId: string;
  trackingCode: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

type Snapshot = Pick<Booking, "id" | "tracking_code" | "service_type" | "status" | "payment_status" | "storage_slot">;

interface NotificationsContextValue {
  notifications: AppNotification[];
  unread: number;
  markAllRead: () => void;
  clear: () => void;
  reviewedIds: ReadonlySet<string>;
  /** True while the review popup is on screen, so other popups can wait. */
  reviewOpen: boolean;
  openReview: (target: ReviewTarget) => void;
  /** Opens the review popup for the first finished, unreviewed booking the user has not dismissed. */
  promptPendingReview: (bookings: ReviewTarget[]) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const MAX_NOTIFICATIONS = 20;
const TOAST_MS = 5000;
const DISMISSED_KEY = "bf-review-dismissed";

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled: notifications still work for this session.
  }
}

function describeChange(previous: Snapshot, next: Snapshot): { title: string; body: string } | null {
  if (previous.status !== next.status) {
    const bodies: Partial<Record<Booking["status"], string>> = {
      picked_up: "พนักงานรับกระเป๋าของคุณแล้ว",
      in_transit: "รถกำลังเดินทางไปยังปลายทาง",
      delivered: "กระเป๋าถึงปลายทางเรียบร้อย อย่าลืมรีวิวให้เราด้วยนะ",
      stored: next.storage_slot ? `เก็บไว้ที่ช่อง ${next.storage_slot} แล้ว` : "รับฝากกระเป๋าเรียบร้อย",
      ready_for_pickup: "ใกล้ถึงเวลานัดรับคืน มารับได้เลย",
      retrieved: "รับคืนกระเป๋าเรียบร้อย ขอบคุณที่ใช้บริการ",
    };
    return { title: STATUS_LABELS[next.status], body: bodies[next.status] ?? "" };
  }
  if (previous.payment_status !== next.payment_status && next.payment_status === "paid") {
    return { title: "ชำระเงินสำเร็จ", body: "ได้รับการชำระเงินจาก Stripe แล้ว" };
  }
  return null;
}

export function NotificationsProvider({ user, children }: { user: User | null; children: ReactNode }) {
  const userId = user?.id ?? null;
  const storageKey = userId ? `bf-notifications-${userId}` : null;
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    storageKey ? readStorage<AppNotification[]>(storageKey, []) : [],
  );
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [reviewedIds, setReviewedIds] = useState<ReadonlySet<string>>(new Set());
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const snapshots = useRef(new Map<string, Snapshot>());
  const reviewedRef = useRef(reviewedIds);
  const [hasActive, setHasActive] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [ownerId, setOwnerId] = useState(userId);

  // Signing in or out switches to that user's notifications (state reset during render, no remount).
  if (ownerId !== userId) {
    setOwnerId(userId);
    setNotifications(storageKey ? readStorage<AppNotification[]>(storageKey, []) : []);
    setToasts([]);
    setReviewedIds(new Set());
    setReviewTarget(null);
    setHasActive(false);
    setReviewsLoaded(false);
  }

  useStatusSync(Boolean(userId) && hasActive, 10_000);

  useEffect(() => {
    reviewedRef.current = reviewedIds;
  }, [reviewedIds]);

  useEffect(() => {
    if (storageKey && ownerId === userId) writeStorage(storageKey, notifications);
  }, [storageKey, ownerId, userId, notifications]);

  const push = useCallback((notification: AppNotification) => {
    setNotifications((list) => [notification, ...list].slice(0, MAX_NOTIFICATIONS));
    setToasts((list) => [...list, notification]);
    window.setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== notification.id)), TOAST_MS);
  }, []);

  useEffect(() => {
    snapshots.current.clear();
    if (!userId) return;
    const supabase = createClient();
    let active = true;

    Promise.all([
      supabase.from("bookings").select("id, tracking_code, service_type, status, payment_status, storage_slot").returns<Snapshot[]>(),
      supabase.from("reviews").select("booking_id").eq("user_id", userId),
    ]).then(([bookings, reviews]) => {
      if (!active) return;
      for (const booking of bookings.data ?? []) snapshots.current.set(booking.id, booking);
      setHasActive((bookings.data ?? []).some((b) => !FINISHED_STATUSES.includes(b.status) && b.status !== "pending_payment"));
      setReviewedIds(new Set((reviews.data ?? []).map((row) => row.booking_id as string)));
      setReviewsLoaded(!reviews.error);
    });

    const channel = supabase
      .channel(`user-bookings-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const next = payload.new as Snapshot;
          const previous = snapshots.current.get(next.id);
          snapshots.current.set(next.id, next);
          setHasActive(
            [...snapshots.current.values()].some((b) => !FINISHED_STATUSES.includes(b.status) && b.status !== "pending_payment"),
          );
          if (!previous) return;
          const change = describeChange(previous, next);
          if (!change) return;
          push({
            id: `${next.id}-${next.status}-${next.payment_status}`,
            bookingId: next.id,
            trackingCode: next.tracking_code,
            ...change,
            createdAt: new Date().toISOString(),
            read: false,
          });
          if (previous.status !== next.status && FINISHED_STATUSES.includes(next.status) && !reviewedRef.current.has(next.id)) {
            setReviewTarget({ id: next.id, tracking_code: next.tracking_code, service_type: next.service_type });
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId, push]);

  const markAllRead = useCallback(() => setNotifications((list) => list.map((n) => ({ ...n, read: true }))), []);
  const clear = useCallback(() => setNotifications([]), []);
  const openReview = useCallback((target: ReviewTarget) => setReviewTarget(target), []);

  const promptPendingReview = useCallback(
    (bookings: ReviewTarget[]) => {
      if (!reviewsLoaded) return;
      const dismissed = readStorage<string[]>(DISMISSED_KEY, []);
      const pending = bookings.find((b) => !reviewedIds.has(b.id) && !dismissed.includes(b.id));
      if (pending) setReviewTarget((current) => current ?? pending);
    },
    [reviewedIds, reviewsLoaded],
  );

  const closeReview = useCallback(() => {
    setReviewTarget((current) => {
      if (current) writeStorage(DISMISSED_KEY, [...readStorage<string[]>(DISMISSED_KEY, []), current.id].slice(-50));
      return null;
    });
  }, []);

  const handleReviewed = useCallback((bookingId: string) => {
    setReviewedIds((ids) => new Set([...ids, bookingId]));
    setReviewTarget(null);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unread: notifications.filter((n) => !n.read).length,
      markAllRead,
      clear,
      reviewedIds,
      reviewOpen: reviewTarget !== null,
      openReview,
      promptPendingReview,
    }),
    [notifications, markAllRead, clear, reviewedIds, reviewTarget, openReview, promptPendingReview],
  );

  return (
    <NotificationsContext value={value}>
      {children}
      <div className="pointer-events-none fixed top-20 right-4 left-4 z-[55] flex flex-col items-end gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-xl"
            role="status"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-highlight text-cta">
              <BellIcon />
            </span>
            <Link href={`/track/${toast.trackingCode}`} className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{toast.title}</p>
              <p className="text-xs text-muted">
                <span className="font-mono">{toast.trackingCode}</span>
                {toast.body ? ` · ${toast.body}` : ""}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => setToasts((list) => list.filter((t) => t.id !== toast.id))}
              className="cursor-pointer rounded-full p-1 text-muted hover:bg-alt"
              aria-label="ปิดการแจ้งเตือน"
            >
              <XIcon />
            </button>
          </div>
        ))}
      </div>
      {user ? (
        <ReviewModal target={reviewTarget} userId={user.id} onClose={closeReview} onReviewed={handleReviewed} />
      ) : null}
    </NotificationsContext>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within NotificationsProvider");
  return context;
}
