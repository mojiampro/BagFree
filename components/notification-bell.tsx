"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/icons";
import { useNotifications } from "@/components/providers/notifications-provider";
import { formatDateTime } from "@/lib/time";

export function NotificationBell() {
  const { notifications, unread, markAllRead, clear } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function toggle() {
    if (!open && unread > 0) markAllRead();
    setOpen((value) => !value);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className="relative grid size-9 cursor-pointer place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
        aria-label={unread > 0 ? `การแจ้งเตือน ${unread} รายการใหม่` : "การแจ้งเตือน"}
        aria-expanded={open}
      >
        <BellIcon className={unread > 0 ? "animate-wiggle" : ""} />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-cta px-1 text-[10px] font-bold text-white ring-2 ring-navy">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100cqw-2rem)] animate-pop-in overflow-hidden rounded-2xl border border-line bg-card text-ink shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">การแจ้งเตือน</p>
            {notifications.length > 0 ? (
              <button type="button" onClick={clear} className="cursor-pointer text-xs text-muted hover:text-danger">
                ล้างทั้งหมด
              </button>
            ) : null}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">ยังไม่มีการแจ้งเตือน</p>
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={`/track/${notification.trackingCode}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 transition hover:bg-alt"
                  >
                    <p className="text-sm font-semibold">
                      {notification.title} <span className="font-mono text-xs font-normal text-muted">{notification.trackingCode}</span>
                    </p>
                    {notification.body ? <p className="text-xs text-muted">{notification.body}</p> : null}
                    <p className="mt-0.5 text-[11px] text-muted">{formatDateTime(notification.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
