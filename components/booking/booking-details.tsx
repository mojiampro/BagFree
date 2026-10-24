import { cardClass } from "@/components/ui";
import { DELIVERY_MODE_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, SERVICE_LABELS, STATUS_BADGE, STATUS_LABELS } from "@/lib/status";
import { formatDateTime } from "@/lib/time";
import type { BookingWithItems } from "@/lib/types";

export function StatusBadge({ status }: { status: BookingWithItems["status"] }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function BookingDetails({ booking }: { booking: BookingWithItems }) {
  const rows: [string, string][] = [
    [
      "บริการ",
      `${SERVICE_LABELS[booking.service_type]}${booking.delivery_mode ? ` · ${DELIVERY_MODE_LABELS[booking.delivery_mode]}` : ""}`,
    ],
  ];
  if (booking.service_type === "delivery") {
    rows.push(["ต้นทาง", booking.origin_name ?? "-"], ["ปลายทาง", booking.destination_name ?? "-"]);
    if (booking.scheduled_at) rows.push(["รับกระเป๋า", formatDateTime(booking.scheduled_at)]);
    if (booking.distance_km != null) rows.push(["ระยะทาง", `${booking.distance_km} กม.`]);
  } else {
    rows.push(["สาขา", booking.origin_name ?? "-"]);
    if (booking.storage_start) rows.push(["ฝาก", formatDateTime(booking.storage_start)]);
    if (booking.storage_end) rows.push(["รับคืน", formatDateTime(booking.storage_end)]);
    if (booking.storage_slot) rows.push(["ช่องเก็บ", booking.storage_slot]);
  }
  rows.push(
    ["ผู้ส่ง / ผู้รับ", `${booking.sender_name} / ${booking.receiver_name}`],
    ["เบอร์โทร", booking.phone],
    [
      "การชำระเงิน",
      `${PAYMENT_STATUS_LABELS[booking.payment_status]}${booking.payment_method ? ` · ${PAYMENT_METHOD_LABELS[booking.payment_method]}` : ""}`,
    ],
  );

  return (
    <div className={`${cardClass} p-5`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">Tracking Code</p>
          <p className="font-mono text-xl font-bold text-navy">{booking.tracking_code}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium break-words text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
