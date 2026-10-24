"use client";

import { LuggageIcon } from "@/components/icons";
import {
  BAG_SIZES,
  DELIVERY_BASE_PRICE,
  MAX_BAGS_PER_SIZE,
  SIZE_LABELS,
  STORAGE_PRICE_PER_DAY,
  type BagCounts,
} from "@/lib/pricing";
import type { ServiceType } from "@/lib/types";

const ICON_SIZES = { S: "text-xl", M: "text-2xl", L: "text-3xl" } as const;

export function BagCounter({
  service,
  value,
  onChange,
}: {
  service: ServiceType;
  value: BagCounts;
  onChange: (value: BagCounts) => void;
}) {
  function update(size: keyof BagCounts, delta: number) {
    const next = Math.min(MAX_BAGS_PER_SIZE, Math.max(0, value[size] + delta));
    onChange({ ...value, [size]: next });
  }

  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {BAG_SIZES.map((size) => {
        const price = service === "storage" ? `${STORAGE_PRICE_PER_DAY[size]} ฿/วัน` : `${DELIVERY_BASE_PRICE[size]} ฿/ใบ`;
        return (
          <div key={size} className="flex items-center gap-3 p-3">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-navy-soft text-navy ${ICON_SIZES[size]}`}>
              <LuggageIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {SIZE_LABELS[size].name} <span className="font-normal text-muted">({SIZE_LABELS[size].hint})</span>
              </p>
              <p className="text-xs text-muted">{price}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => update(size, -1)}
                disabled={value[size] === 0}
                className="grid size-9 cursor-pointer place-items-center rounded-full border border-line text-lg font-bold text-navy transition hover:bg-navy-soft disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`ลด ${SIZE_LABELS[size].name}`}
              >
                −
              </button>
              <span className="w-6 text-center font-semibold tabular-nums" aria-live="polite">
                {value[size]}
              </span>
              <button
                type="button"
                onClick={() => update(size, 1)}
                disabled={value[size] >= MAX_BAGS_PER_SIZE}
                className="grid size-9 cursor-pointer place-items-center rounded-full border border-navy bg-navy text-lg font-bold text-white transition hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`เพิ่ม ${SIZE_LABELS[size].name}`}
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
