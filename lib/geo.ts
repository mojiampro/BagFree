import type { Place, RouteGeoJson } from "@/lib/types";

/** Rough bounding box of greater Bangkok, used to restrict hotel search and validate coordinates. */
export const BANGKOK_BOUNDS = { south: 13.45, north: 14.15, west: 100.25, east: 100.95 };
export const BANGKOK_CENTER: [number, number] = [13.7563, 100.5018];

export function isInBangkok(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= BANGKOK_BOUNDS.south &&
    lat <= BANGKOK_BOUNDS.north &&
    lng >= BANGKOK_BOUNDS.west &&
    lng <= BANGKOK_BOUNDS.east
  );
}

/** Fallback hotels when Nominatim is unavailable or returns nothing. */
export const SAMPLE_HOTELS: Place[] = [
  { name: "Mandarin Oriental Bangkok (เจริญกรุง)", lat: 13.7236, lng: 100.5145 },
  { name: "The Peninsula Bangkok (คลองสาน)", lat: 13.7231, lng: 100.5108 },
  { name: "Siam Kempinski Hotel Bangkok (สยาม)", lat: 13.7489, lng: 100.535 },
  { name: "Centara Grand at CentralWorld (ราชประสงค์)", lat: 13.7478, lng: 100.5397 },
  { name: "Grande Centre Point Terminal 21 (อโศก)", lat: 13.7377, lng: 100.5604 },
];

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function straightLine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): RouteGeoJson {
  return {
    type: "LineString",
    coordinates: [
      [a.lng, a.lat],
      [b.lng, b.lat],
    ],
  };
}

/** Total length of a GeoJSON LineString in km. */
export function lineLengthKm(route: RouteGeoJson) {
  let total = 0;
  for (let i = 1; i < route.coordinates.length; i++) {
    const [lng1, lat1] = route.coordinates[i - 1];
    const [lng2, lat2] = route.coordinates[i];
    total += haversineKm({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 });
  }
  return total;
}

/** Point at `fraction` (0–1) of the way along the route, returned as [lat, lng]. */
export function pointAlong(route: RouteGeoJson, fraction: number): [number, number] {
  const coords = route.coordinates;
  if (coords.length === 0) return BANGKOK_CENTER;
  if (coords.length === 1 || fraction <= 0) return [coords[0][1], coords[0][0]];
  const last = coords[coords.length - 1];
  if (fraction >= 1) return [last[1], last[0]];

  const segments: number[] = [];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const length = haversineKm(
      { lat: coords[i - 1][1], lng: coords[i - 1][0] },
      { lat: coords[i][1], lng: coords[i][0] },
    );
    segments.push(length);
    total += length;
  }
  if (total === 0) return [last[1], last[0]];

  let remaining = fraction * total;
  for (let i = 0; i < segments.length; i++) {
    if (remaining <= segments[i]) {
      const t = segments[i] === 0 ? 0 : remaining / segments[i];
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[i + 1];
      return [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t];
    }
    remaining -= segments[i];
  }
  return [last[1], last[0]];
}
