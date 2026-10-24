import type { BagSize } from "@/lib/types";

/** Single source of truth for prices. Used by the booking UI (preview) and the API (real charge). */

export const BAG_SIZES: readonly BagSize[] = ["S", "M", "L"];

export const SIZE_LABELS: Record<BagSize, { name: string; hint: string }> = {
  S: { name: "Small", hint: "≤ 20 นิ้ว" },
  M: { name: "Medium", hint: "21–26 นิ้ว" },
  L: { name: "Large", hint: "≥ 27 นิ้ว" },
};

export const STORAGE_PRICE_PER_DAY: Record<BagSize, number> = { S: 50, M: 80, L: 100 };
export const DELIVERY_BASE_PRICE: Record<BagSize, number> = { S: 150, M: 200, L: 250 };
export const DELIVERY_PRICE_PER_KM = 10;
export const MAX_BAGS_PER_SIZE = 20;

export type BagCounts = Record<BagSize, number>;

export interface PriceLine {
  label: string;
  detail: string;
  amount: number;
}

export interface DiscountRule {
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_total: number;
  max_discount: number | null;
}

export interface PriceBreakdown {
  lines: PriceLine[];
  items: { size: BagSize; quantity: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  total: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function emptyBagCounts(): BagCounts {
  return { S: 0, M: 0, L: 0 };
}

export function totalBags(counts: BagCounts) {
  return BAG_SIZES.reduce((sum, size) => sum + counts[size], 0);
}

export function isValidBagCounts(counts: BagCounts) {
  return (
    BAG_SIZES.every(
      (size) => Number.isInteger(counts[size]) && counts[size] >= 0 && counts[size] <= MAX_BAGS_PER_SIZE,
    ) && totalBags(counts) > 0
  );
}

/** Storage is charged per started day: 25 hours = 2 days. */
export function storageDays(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / DAY_MS);
}

export function roundDistanceKm(km: number) {
  return Math.round(km * 10) / 10;
}

export function distanceFee(distanceKm: number) {
  return Math.round(roundDistanceKm(distanceKm) * DELIVERY_PRICE_PER_KM);
}

export function computeDiscount(subtotal: number, rule: DiscountRule | null) {
  if (!rule || subtotal <= 0 || subtotal < rule.min_total) return 0;
  let amount = rule.type === "percent" ? (subtotal * rule.value) / 100 : rule.value;
  if (rule.max_discount != null) amount = Math.min(amount, rule.max_discount);
  return Math.round(Math.min(amount, subtotal));
}

export function describeDiscount(rule: DiscountRule) {
  const parts = [rule.type === "percent" ? `ลด ${rule.value}%` : `ลด ${rule.value} ฿`];
  if (rule.min_total > 0) parts.push(`ขั้นต่ำ ${rule.min_total} ฿`);
  if (rule.max_discount != null) parts.push(`สูงสุด ${rule.max_discount} ฿`);
  return parts.join(" · ");
}

function finalize(
  lines: PriceLine[],
  items: PriceBreakdown["items"],
  rule: DiscountRule | null,
): PriceBreakdown {
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const discount = computeDiscount(subtotal, rule);
  return { lines, items, subtotal, discount, total: subtotal - discount };
}

export function priceStorage(
  counts: BagCounts,
  start: Date,
  end: Date,
  rule: DiscountRule | null = null,
): PriceBreakdown {
  const days = storageDays(start, end);
  const items = BAG_SIZES.filter((size) => counts[size] > 0).map((size) => ({
    size,
    quantity: counts[size],
    unitPrice: STORAGE_PRICE_PER_DAY[size] * days,
  }));
  const lines = items.map((item) => ({
    label: `${SIZE_LABELS[item.size].name} × ${item.quantity}`,
    detail: `${STORAGE_PRICE_PER_DAY[item.size]} ฿ × ${days} วัน`,
    amount: item.unitPrice * item.quantity,
  }));
  return finalize(lines, items, rule);
}

export function priceDelivery(
  counts: BagCounts,
  distanceKm: number,
  rule: DiscountRule | null = null,
): PriceBreakdown {
  const items = BAG_SIZES.filter((size) => counts[size] > 0).map((size) => ({
    size,
    quantity: counts[size],
    unitPrice: DELIVERY_BASE_PRICE[size],
  }));
  const lines = items.map((item) => ({
    label: `${SIZE_LABELS[item.size].name} × ${item.quantity}`,
    detail: `${item.unitPrice} ฿ / ใบ`,
    amount: item.unitPrice * item.quantity,
  }));
  const km = roundDistanceKm(distanceKm);
  lines.push({
    label: "ค่าระยะทาง",
    detail: `${km} กม. × ${DELIVERY_PRICE_PER_KM} ฿`,
    amount: distanceFee(km),
  });
  return finalize(lines, items, rule);
}

/** Stripe amounts are in satang. */
export function toSatang(baht: number) {
  return Math.round(baht * 100);
}
