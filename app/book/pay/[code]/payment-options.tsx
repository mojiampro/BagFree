"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BanknoteIcon, CreditCardIcon, QrCodeIcon, Spinner } from "@/components/icons";
import { buttonClass, cardClass } from "@/components/ui";
import { formatBaht } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/status";
import type { PaymentMethod } from "@/lib/types";

const OPTIONS: { value: PaymentMethod; icon: typeof CreditCardIcon; hint: string }[] = [
  { value: "card", icon: CreditCardIcon, hint: "ผ่าน Stripe Checkout (ทดสอบด้วย 4242 4242 4242 4242)" },
  { value: "promptpay", icon: QrCodeIcon, hint: "สแกน QR ผ่าน Stripe Checkout" },
  { value: "cash", icon: BanknoteIcon, hint: "ชำระเงินสดที่เคาน์เตอร์สาขา" },
];

export function PaymentOptions({ code, total }: { code: string; total: number }) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${code}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "เริ่มการชำระเงินไม่สำเร็จ");
      const target = data.redirect as string;
      if (target.startsWith("/")) router.push(target);
      else window.location.assign(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เริ่มการชำระเงินไม่สำเร็จ");
      setBusy(false);
    }
  }

  return (
    <div className={`${cardClass} space-y-4 p-5`}>
      <h2 className="text-lg font-bold text-navy">เลือกวิธีชำระเงิน</h2>
      <div className="space-y-2" role="radiogroup" aria-label="วิธีชำระเงิน">
        {OPTIONS.map((option) => {
          const active = method === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMethod(option.value)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                active ? "border-navy bg-navy-soft/50" : "border-line bg-white hover:border-navy/40"
              }`}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-lg text-lg ${active ? "bg-navy text-white" : "bg-alt text-navy"}`}>
                <option.icon />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{PAYMENT_METHOD_LABELS[option.value]}</span>
                <span className="block text-xs text-muted">{option.hint}</span>
              </span>
              <span className={`ml-auto size-5 shrink-0 rounded-full border-2 ${active ? "border-[6px] border-navy" : "border-line"}`} />
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button type="button" onClick={pay} disabled={busy} className={buttonClass("primary", "lg", "w-full")}>
        {busy ? <Spinner /> : null}
        {method === "cash" ? "ยืนยันชำระที่เคาน์เตอร์" : `ชำระเงิน ${formatBaht(total)}`}
      </button>
    </div>
  );
}
