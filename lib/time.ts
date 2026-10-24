import type { Branch } from "@/lib/types";

/** Bangkok has no daylight saving time, so a fixed +07:00 offset is exact. */
export const BANGKOK_OFFSET_MINUTES = 7 * 60;
const MINUTE_MS = 60 * 1000;

/** `<input type="datetime-local">` value (Bangkok wall time) → ISO string. */
export function bangkokLocalToIso(local: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const date = new Date(`${local}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Date → `datetime-local` value in Bangkok wall time. */
export function toBangkokLocalInput(date: Date) {
  const shifted = new Date(date.getTime() + BANGKOK_OFFSET_MINUTES * MINUTE_MS);
  return shifted.toISOString().slice(0, 16);
}

export function bangkokMinutesOfDay(date: Date) {
  const total = Math.floor(date.getTime() / MINUTE_MS) + BANGKOK_OFFSET_MINUTES;
  return ((total % 1440) + 1440) % 1440;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function isOpen24Hours(branch: Pick<Branch, "open_time" | "close_time">) {
  return timeToMinutes(branch.open_time) === 0 && timeToMinutes(branch.close_time) >= 24 * 60 - 1;
}

export function isWithinOpeningHours(branch: Pick<Branch, "open_time" | "close_time">, date: Date) {
  if (isOpen24Hours(branch)) return true;
  const minutes = bangkokMinutesOfDay(date);
  return minutes >= timeToMinutes(branch.open_time) && minutes <= timeToMinutes(branch.close_time);
}

export function formatOpeningHours(branch: Pick<Branch, "open_time" | "close_time">) {
  if (isOpen24Hours(branch)) return "24 ชั่วโมง";
  return `${branch.open_time.slice(0, 5)}–${branch.close_time.slice(0, 5)} น.`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDateTime(value: string | Date) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | Date) {
  return dateFormatter.format(new Date(value));
}

/** Request-time timestamp for Server Components (keeps render bodies free of direct impure calls). */
export function requestTimestamp() {
  return Date.now();
}
