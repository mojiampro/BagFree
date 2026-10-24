import type { BagCounts } from "@/lib/pricing";
import type { DeliveryMode, Place, ServiceType } from "@/lib/types";

/** Body of POST /api/bookings. Only choices are sent; prices and codes are computed on the server. */
export interface BookingRequest {
  service_type: ServiceType;
  delivery_mode?: DeliveryMode;
  origin_branch_id?: number;
  destination_branch_id?: number;
  hotel?: Place;
  scheduled_at?: string;
  branch_id?: number;
  storage_start?: string;
  storage_end?: string;
  sender_name: string;
  receiver_name: string;
  phone: string;
  bags: BagCounts;
  discount_code?: string;
}

export interface CreateBookingResponse {
  tracking_code: string;
}

export interface DiscountResponse {
  code: string;
  discount: number;
  description: string;
}
