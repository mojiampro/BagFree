import { DELIVERY_PRICE_PER_KM, SIZE_LABELS, storageDays, type PriceLine } from "@/lib/pricing";
import type { BookingWithItems } from "@/lib/types";

const SIZE_ORDER = { S: 0, M: 1, L: 2 } as const;

/** Rebuilds the itemised price lines of a saved booking from the amounts stored at booking time. */
export function bookingPriceLines(booking: BookingWithItems): PriceLine[] {
  const items = [...booking.booking_items].sort((a, b) => SIZE_ORDER[a.size] - SIZE_ORDER[b.size]);
  const days =
    booking.storage_start && booking.storage_end
      ? storageDays(new Date(booking.storage_start), new Date(booking.storage_end))
      : 0;

  const lines: PriceLine[] = items.map((item) => {
    const unit = Number(item.unit_price);
    return {
      label: `${SIZE_LABELS[item.size].name} × ${item.quantity}`,
      detail:
        booking.service_type === "storage" && days > 0
          ? `${unit / days} ฿ × ${days} วัน`
          : `${unit} ฿ / ใบ`,
      amount: unit * item.quantity,
    };
  });

  if (booking.service_type === "delivery") {
    const itemsTotal = lines.reduce((sum, line) => sum + line.amount, 0);
    lines.push({
      label: "ค่าระยะทาง",
      detail: `${Number(booking.distance_km ?? 0)} กม. × ${DELIVERY_PRICE_PER_KM} ฿`,
      amount: Number(booking.subtotal) - itemsTotal,
    });
  }
  return lines;
}

export function bookingRouteLabel(booking: Pick<BookingWithItems, "service_type" | "origin_name" | "destination_name">) {
  if (booking.service_type === "storage") return booking.origin_name ?? "";
  return `${booking.origin_name ?? ""} → ${booking.destination_name ?? ""}`;
}
