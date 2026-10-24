"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
}

export interface TrackingMapProps {
  /** Route as [lat, lng] pairs. */
  route?: [number, number][];
  points?: (MapPoint & { kind: "origin" | "destination" | "branch" })[];
  vehicle?: { lat: number; lng: number; live: boolean } | null;
  /** Keep the vehicle centred while it moves (Live Driver Mode). */
  follow?: boolean;
  className?: string;
}

const SVG = {
  pin: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  flag: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4a1 1 0 0 1 1-1h12l-2 5 2 5H5"/></svg>',
  train: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16M12 3v8"/></svg>',
  truck: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
};

function markerIcon(svg: string, color: string, size = 36, pulse = false) {
  return L.divIcon({
    className: "bf-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="position:relative;width:${size}px;height:${size}px">${
      pulse
        ? `<span style="position:absolute;inset:-6px;border-radius:9999px;background:${color};opacity:.35" class="animate-ping"></span>`
        : ""
    }<div style="position:relative;width:100%;height:100%;border-radius:9999px;background:${color};color:var(--color-card);display:grid;place-items:center;border:3px solid var(--color-card);box-shadow:0 4px 12px rgb(15 23 42 / .35)">${svg}</div></div>`,
  });
}

/** `boundsKey` is "lat,lng;lat,lng"; re-fits only when the fixed points change, not on vehicle moves. */
function FitBounds({ boundsKey }: { boundsKey: string }) {
  const map = useMap();
  useEffect(() => {
    if (!boundsKey) return;
    const positions = boundsKey.split(";").map((pair) => pair.split(",").map(Number) as [number, number]);
    if (positions.length === 1) map.setView(positions[0], 15);
    else map.fitBounds(L.latLngBounds(positions), { padding: [40, 40], maxZoom: 16 });
  }, [map, boundsKey]);
  return null;
}

function Follow({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lng], { animate: true });
  }, [map, lat, lng]);
  return null;
}

export default function TrackingMap({ route = [], points = [], vehicle, follow, className = "h-80" }: TrackingMapProps) {
  const icons = useMemo(
    () => ({
      origin: markerIcon(SVG.pin, "var(--color-navy)"),
      destination: markerIcon(SVG.flag, "var(--color-success)"),
      branch: markerIcon(SVG.train, "var(--color-navy)"),
      vehicle: markerIcon(SVG.truck, "var(--color-cta)", 42),
      live: markerIcon(SVG.truck, "var(--color-cta)", 42, true),
    }),
    [],
  );

  const fixed: [number, number][] = points.map((p) => [p.lat, p.lng]);
  const fitTo = fixed.length > 0 ? fixed : vehicle ? [[vehicle.lat, vehicle.lng] as [number, number]] : [];
  const center = fitTo[0] ?? [13.7563, 100.5018];

  return (
    <div className={`relative isolate overflow-hidden rounded-2xl border border-line ${className}`}>
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="size-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {route.length > 1 ? (
          <>
            <Polyline positions={route} pathOptions={{ className: "bf-route-casing", weight: 9 }} />
            <Polyline positions={route} pathOptions={{ className: "bf-route", weight: 5 }} />
          </>
        ) : null}
        {points.map((point) => (
          <Marker key={`${point.kind}-${point.lat}-${point.lng}`} position={[point.lat, point.lng]} icon={icons[point.kind]}>
            <Tooltip direction="top" offset={[0, -18]}>
              {point.label}
            </Tooltip>
          </Marker>
        ))}
        {vehicle ? (
          <Marker position={[vehicle.lat, vehicle.lng]} icon={vehicle.live ? icons.live : icons.vehicle} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -22]}>
              {vehicle.live ? "ตำแหน่งคนขับ (Live)" : "รถจำลอง"}
            </Tooltip>
          </Marker>
        ) : null}
        <FitBounds boundsKey={fitTo.map((p) => p.join(",")).join(";")} />
        {follow && vehicle ? <Follow lat={vehicle.lat} lng={vehicle.lng} /> : null}
      </MapContainer>
    </div>
  );
}
