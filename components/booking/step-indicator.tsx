import { CheckIcon } from "@/components/icons";

export const BOOKING_STEPS = ["เลือกบริการ", "รายละเอียด", "สรุปราคา", "ชำระเงิน", "ยืนยัน"];

export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-start gap-1" aria-label="ขั้นตอนการจอง">
      {BOOKING_STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5 text-center" aria-current={active ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${index === 0 ? "opacity-0" : done || active ? "bg-navy" : "bg-line"}`} />
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition ${
                  done ? "bg-navy text-white" : active ? "bg-cta text-white ring-4 ring-highlight" : "bg-alt text-muted"
                }`}
              >
                {done ? <CheckIcon /> : index + 1}
              </span>
              <span
                className={`h-0.5 flex-1 ${index === BOOKING_STEPS.length - 1 ? "opacity-0" : done ? "bg-navy" : "bg-line"}`}
              />
            </div>
            <span className={`text-[11px] leading-tight @md:text-xs ${active ? "font-semibold text-navy" : "text-muted"}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
