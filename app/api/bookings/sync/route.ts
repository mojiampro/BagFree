import { jsonError } from "@/lib/booking-server";
import { expectedStatus } from "@/lib/simulation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Booking } from "@/lib/types";

const ACTIVE = ["picked_up", "in_transit", "stored"];

/**
 * Advances the signed-in user's active bookings along the demo timeline (lib/simulation.ts).
 * Status is derived from server time and the stored start time, so the client cannot fast-forward it.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("กรุณาเข้าสู่ระบบ", 401);

  const { data, error } = await supabase
    .from("bookings")
    .select("id, service_type, status, started_at, distance_km, storage_end")
    .in("status", ACTIVE)
    .returns<Pick<Booking, "id" | "service_type" | "status" | "started_at" | "distance_km" | "storage_end">[]>();
  if (error) return jsonError(error.message, 500);

  const now = Date.now();
  const changes = (data ?? [])
    .map((booking) => ({ id: booking.id, from: booking.status, to: expectedStatus({ ...booking, distance_km: booking.distance_km == null ? null : Number(booking.distance_km) }, now) }))
    .filter((change) => change.to !== change.from);

  if (changes.length > 0) {
    const admin = createAdminClient();
    await Promise.all(
      changes.map((change) =>
        admin.from("bookings").update({ status: change.to }).eq("id", change.id).eq("status", change.from).eq("user_id", user.id),
      ),
    );
  }

  return Response.json({ updated: changes.map(({ id, to }) => ({ id, status: to })) });
}
