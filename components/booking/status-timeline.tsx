import { CheckIcon } from "@/components/icons";
import { DELIVERY_FLOW, STATUS_LABELS, STORAGE_FLOW } from "@/lib/status";
import type { BookingStatus, ServiceType } from "@/lib/types";

export function StatusTimeline({ service, status }: { service: ServiceType; status: BookingStatus }) {
  const flow = service === "delivery" ? DELIVERY_FLOW : STORAGE_FLOW;
  const currentIndex = flow.indexOf(status);

  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="สถานะ">
      {flow.map((step, index) => {
        const done = index < currentIndex || (index === currentIndex && index === flow.length - 1);
        const active = index === currentIndex && !done;
        return (
          <li key={step} className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex w-full items-center">
              <span className={`h-1 flex-1 rounded-full ${index === 0 ? "opacity-0" : index <= currentIndex ? "bg-navy" : "bg-line"}`} />
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-500 ${
                  done ? "bg-success text-white" : active ? "bg-cta text-white ring-4 ring-highlight" : "bg-alt text-muted"
                }`}
              >
                {done ? <CheckIcon /> : index + 1}
              </span>
              <span
                className={`h-1 flex-1 rounded-full ${index === flow.length - 1 ? "opacity-0" : index < currentIndex ? "bg-navy" : "bg-line"}`}
              />
            </div>
            <span className={`text-[11px] leading-tight ${active || done ? "font-semibold text-ink" : "text-muted"}`}>
              {STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
