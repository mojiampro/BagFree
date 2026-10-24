import type { BookingStatus, DeliveryMode, PaymentMethod, PaymentStatus, ServiceType } from "@/lib/types";

export const SERVICE_LABELS: Record<ServiceType, string> = {
  delivery: "ส่งกระเป๋า",
  storage: "ฝากกระเป๋า",
};

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  branch_to_hotel: "สาขา → โรงแรม",
  hotel_to_branch: "โรงแรม → สาขา",
  branch_to_branch: "สาขา → สาขา",
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: "รอชำระเงิน",
  picked_up: "รับกระเป๋าแล้ว",
  in_transit: "กำลังจัดส่ง",
  delivered: "ส่งถึงแล้ว",
  stored: "ฝากไว้แล้ว",
  ready_for_pickup: "พร้อมให้รับคืน",
  retrieved: "รับคืนแล้ว",
};

export const STATUS_BADGE: Record<BookingStatus, string> = {
  pending_payment: "bg-highlight text-cta-hover",
  picked_up: "bg-navy-soft text-navy",
  in_transit: "bg-navy-soft text-navy",
  delivered: "bg-success-soft text-success",
  stored: "bg-navy-soft text-navy",
  ready_for_pickup: "bg-highlight text-cta-hover",
  retrieved: "bg-success-soft text-success",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "บัตรเครดิต/เดบิต",
  promptpay: "PromptPay",
  cash: "เงินสดที่เคาน์เตอร์",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "ยังไม่ชำระ",
  paid: "ชำระแล้ว",
  pay_at_counter: "ชำระที่เคาน์เตอร์",
  failed: "ชำระไม่สำเร็จ",
  expired: "หมดเวลาชำระ",
};

export const DELIVERY_FLOW: BookingStatus[] = ["pending_payment", "picked_up", "in_transit", "delivered"];
export const STORAGE_FLOW: BookingStatus[] = ["pending_payment", "stored", "ready_for_pickup", "retrieved"];

export const FINISHED_STATUSES: BookingStatus[] = ["delivered", "retrieved"];

export function isFinished(status: BookingStatus) {
  return FINISHED_STATUSES.includes(status);
}
