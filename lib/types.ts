export type BagSize = "S" | "M" | "L";
export type ServiceType = "delivery" | "storage";
export type DeliveryMode = "branch_to_hotel" | "hotel_to_branch" | "branch_to_branch";
export type PaymentMethod = "card" | "promptpay" | "cash";
export type PaymentStatus = "unpaid" | "paid" | "pay_at_counter" | "failed" | "expired";
export type DeliveryStatus = "pending_payment" | "picked_up" | "in_transit" | "delivered";
export type StorageStatus = "pending_payment" | "stored" | "ready_for_pickup" | "retrieved";
export type BookingStatus = DeliveryStatus | StorageStatus;

export interface Branch {
  id: number;
  name: string;
  lat: number;
  lng: number;
  open_time: string;
  close_time: string;
  phone: string;
}

export interface Place {
  name: string;
  lat: number;
  lng: number;
}

export interface RouteGeoJson {
  type: "LineString";
  coordinates: [number, number][];
}

export interface BookingItem {
  id: string;
  booking_id: string;
  size: BagSize;
  quantity: number;
  unit_price: number;
}

export interface Booking {
  id: string;
  user_id: string;
  service_type: ServiceType;
  delivery_mode: DeliveryMode | null;
  origin_name: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_name: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  branch_id: number | null;
  sender_name: string;
  receiver_name: string;
  phone: string;
  scheduled_at: string | null;
  storage_start: string | null;
  storage_end: string | null;
  subtotal: number;
  discount: number;
  total: number;
  discount_code: string | null;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  status: BookingStatus;
  tracking_code: string;
  seal_code: string;
  storage_slot: string | null;
  route_geojson: RouteGeoJson | null;
  distance_km: number | null;
  started_at: string | null;
  created_at: string;
}

export interface BookingWithItems extends Booking {
  booking_items: BookingItem[];
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: string;
  service_type: ServiceType;
}

export interface DriverLocation {
  id: string;
  booking_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}
