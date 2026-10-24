"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/icons";

const INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 30;

/** Re-renders the server page until the Stripe webhook marks the booking as paid. */
export function PaymentPoller() {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const gaveUp = attempts >= MAX_ATTEMPTS;

  useEffect(() => {
    if (gaveUp) return;
    const timer = window.setTimeout(() => {
      router.refresh();
      setAttempts((count) => count + 1);
    }, INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [attempts, gaveUp, router]);

  if (gaveUp) {
    return (
      <div className="rounded-2xl border border-line bg-card p-5 text-sm text-muted">
        <p className="font-semibold text-ink">ยังไม่ได้รับการยืนยันการชำระเงินจาก Stripe</p>
        <p className="mt-1">
          หากชำระเงินแล้ว ระบบจะอัปเดตอัตโนมัติเมื่อได้รับ webhook (ตอนพัฒนาต้องรัน <code>stripe listen</code>)
        </p>
        <button
          type="button"
          onClick={() => setAttempts(0)}
          className="mt-3 cursor-pointer font-semibold text-navy underline-offset-4 hover:underline"
        >
          ตรวจสอบอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-5" role="status">
      <Spinner className="text-2xl text-navy" />
      <div>
        <p className="font-semibold text-ink">กำลังยืนยันการชำระเงิน...</p>
        <p className="text-sm text-muted">รอการยืนยันจาก Stripe สักครู่</p>
      </div>
    </div>
  );
}
