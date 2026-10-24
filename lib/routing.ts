import "server-only";
import { haversineKm, straightLine } from "@/lib/geo";
import type { RouteGeoJson } from "@/lib/types";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

interface OsrmResponse {
  code: string;
  routes?: { distance: number; geometry: RouteGeoJson }[];
}

/**
 * Calls the public OSRM server once per booking. Falls back to a straight line
 * (and its great-circle distance) when OSRM is slow or unavailable.
 */
export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ route: RouteGeoJson; distanceKm: number; source: "osrm" | "straight" }> {
  try {
    const url = `${OSRM_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "BagFree-Student-Project/1.0" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`OSRM ${response.status}`);
    const body = (await response.json()) as OsrmResponse;
    const best = body.routes?.[0];
    if (body.code !== "Ok" || !best || best.geometry.coordinates.length < 2) throw new Error("OSRM no route");
    return { route: best.geometry, distanceKm: best.distance / 1000, source: "osrm" };
  } catch {
    return { route: straightLine(from, to), distanceKm: haversineKm(from, to), source: "straight" };
  }
}
