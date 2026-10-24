"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Booking, DriverLocation } from "@/lib/types";

/** Current time, ticking every `intervalMs`. Starts from `initial` so server and client render the same markup. */
export function useNow(initial: number, intervalMs = 1000, enabled = true) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}

/** Asks the server to advance demo statuses on an interval while `enabled`. */
export function useStatusSync(enabled: boolean, intervalMs = 5000) {
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    async function sync() {
      try {
        await fetch("/api/bookings/sync", { method: "POST" });
      } catch {
        // Offline or server hiccup: the next tick retries.
      }
    }
    sync();
    const id = window.setInterval(() => {
      if (!stopped) sync();
    }, intervalMs);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [enabled, intervalMs]);
}

/** Live copy of one booking: starts from the server snapshot and applies realtime UPDATEs. */
export function useLiveBooking<T extends Booking>(initial: T) {
  const [booking, setBooking] = useState<T>(initial);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`booking-${initial.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${initial.id}` },
        (payload) => setBooking((current) => ({ ...current, ...(payload.new as Partial<Booking>) })),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [initial.id]);
  return [booking, setBooking] as const;
}

/** Latest Live Driver Mode position for a booking, if a driver is sharing one. */
export function useDriverLocation(bookingId: string) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase
      .from("driver_locations")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle<DriverLocation>()
      .then(({ data }) => {
        if (active && data) setLocation(data);
      });
    const channel = supabase
      .channel(`driver-${bookingId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_locations", filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          if (payload.eventType === "DELETE") setLocation(null);
          else setLocation(payload.new as DriverLocation);
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [bookingId]);
  return location;
}
