import { formatBaht } from "@/lib/format";
import type { PriceLine } from "@/lib/pricing";

export function PriceSummary({
  lines,
  subtotal,
  discount,
  total,
  discountCode,
  note,
}: {
  lines: PriceLine[];
  subtotal: number;
  discount: number;
  total: number;
  discountCode?: string | null;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <ul className="space-y-2.5 text-sm">
        {lines.map((line) => (
          <li key={line.label} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-ink">{line.label}</p>
              <p className="text-xs text-muted">{line.detail}</p>
            </div>
            <span className="shrink-0 font-medium tabular-nums">{formatBaht(line.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2 border-t border-dashed border-line pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">รวม</span>
          <span className="tabular-nums">{formatBaht(subtotal)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-success">
            <span>ส่วนลด{discountCode ? ` (${discountCode})` : ""}</span>
            <span className="tabular-nums">−{formatBaht(discount)}</span>
          </div>
        ) : null}
        <div className="flex items-end justify-between pt-1">
          <span className="font-semibold text-ink">ยอดชำระ</span>
          <span className="text-2xl font-bold text-navy tabular-nums">{formatBaht(total)}</span>
        </div>
        {note ? <p className="pt-1 text-xs text-muted">{note}</p> : null}
      </div>
    </div>
  );
}
