"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PromoSlider } from "@/components/ads/promo-slider";
import { Modal } from "@/components/modal";
import { useAuth } from "@/components/providers/auth-provider";
import { useNotifications } from "@/components/providers/notifications-provider";
import { buttonClass } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/time";

const SNOOZE_KEY = "bf-ad-snooze-until";
const SESSION_KEY = "bf-ad-shown";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const OPEN_DELAY_MS = 800;
/** Only interrupt on browsing pages, never mid-booking, tracking or at the counter. */
const ALLOWED_PATHS = new Set(["/", "/dashboard"]);

function readNumber(storage: Storage, key: string) {
  try {
    return Number(storage.getItem(key) ?? 0);
  } catch {
    return 0;
  }
}

function write(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage disabled: the popup simply may show again next visit.
  }
}

/** "Places near our stations" popup, shown once per browser session after signing in. */
export function AdPopup() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { reviewOpen } = useNotifications();
  const [open, setOpen] = useState(false);
  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(null);
  const [branchIds, setBranchIds] = useState<Record<string, number>>({});

  const eligible = Boolean(user) && !loading && ALLOWED_PATHS.has(pathname) && !reviewOpen;

  useEffect(() => {
    if (!eligible) return;
    if (readNumber(window.localStorage, SNOOZE_KEY) > Date.now()) return;
    if (readNumber(window.sessionStorage, SESSION_KEY) > 0) return;

    const timer = window.setTimeout(() => {
      write(window.sessionStorage, SESSION_KEY, String(Date.now()));
      setSnoozeUntil(null);
      setOpen(true);
      createClient()
        .from("branches")
        .select("id, name")
        .then(({ data }) => {
          if (data) setBranchIds(Object.fromEntries(data.map((branch) => [branch.name as string, branch.id as number])));
        });
    }, OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [eligible]);

  function close() {
    if (snoozeUntil) write(window.localStorage, SNOOZE_KEY, String(snoozeUntil));
    setOpen(false);
  }

  return (
    <Modal open={open && !reviewOpen} onClose={close} title="แนะนำที่เที่ยวใกล้สถานี" description="ฝากกระเป๋าไว้กับเรา แล้วไปเที่ยวตัวเปล่า">
      <div className="space-y-4">
        <PromoSlider branchIds={branchIds} interval={4500} compact onNavigate={close} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={snoozeUntil !== null}
              onChange={(event) => setSnoozeUntil(event.target.checked ? Date.now() + SNOOZE_MS : null)}
              className="size-4 accent-navy"
            />
            ไม่ต้องแสดงอีกภายใน 7 วัน
          </label>
          <button type="button" onClick={close} className={buttonClass("secondary", "sm")}>
            ปิด
          </button>
        </div>
        {snoozeUntil ? <p className="text-xs text-muted">จะไม่แสดงอีกจนถึง {formatDate(new Date(snoozeUntil))}</p> : null}
      </div>
    </Modal>
  );
}
