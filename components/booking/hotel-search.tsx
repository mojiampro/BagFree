"use client";

import { useEffect, useId, useState } from "react";
import { BuildingIcon, SearchIcon, Spinner, XIcon } from "@/components/icons";
import { inputClass } from "@/components/ui";
import { BANGKOK_BOUNDS, isInBangkok, SAMPLE_HOTELS } from "@/lib/geo";
import type { Place } from "@/lib/types";

const DEBOUNCE_MS = 1000;
const MIN_QUERY = 3;

interface NominatimResult {
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
}

type SearchState =
  | { query: string; status: "loading" }
  | { query: string; status: "done"; results: Place[] }
  | { query: string; status: "error" };

function toPlace(result: NominatimResult): Place {
  const parts = result.display_name.split(",").map((part) => part.trim());
  const name = result.name?.trim() || parts[0];
  const area = parts.slice(1, 3).filter((part) => part !== name).join(", ");
  return { name: area ? `${name} (${area})` : name, lat: Number(result.lat), lng: Number(result.lon) };
}

export function HotelSearch({
  value,
  onChange,
  invalid,
}: {
  value: Place | null;
  onChange: (place: Place | null) => void;
  invalid?: boolean;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState | null>(null);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_QUERY) return;
    const controller = new AbortController();
    // Nominatim allows ~1 request/second, so wait until typing pauses for a second.
    const timer = window.setTimeout(async () => {
      setSearch({ query: trimmed, status: "loading" });
      try {
        const params = new URLSearchParams({
          q: trimmed,
          format: "jsonv2",
          limit: "6",
          countrycodes: "th",
          bounded: "1",
          viewbox: `${BANGKOK_BOUNDS.west},${BANGKOK_BOUNDS.north},${BANGKOK_BOUNDS.east},${BANGKOK_BOUNDS.south}`,
          "accept-language": "th,en",
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as NominatimResult[];
        const results = data.map(toPlace).filter((place) => isInBangkok(place.lat, place.lng));
        setSearch({ query: trimmed, status: "done", results });
      } catch {
        if (!controller.signal.aborted) setSearch({ query: trimmed, status: "error" });
      }
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-navy bg-navy-soft/50 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-navy text-white">
          <BuildingIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{value.name}</p>
          <p className="text-xs text-muted">
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="cursor-pointer rounded-full p-2 text-muted transition hover:bg-white hover:text-danger"
          aria-label="เปลี่ยนโรงแรม"
        >
          <XIcon />
        </button>
      </div>
    );
  }

  const current = search && search.query === trimmed && trimmed.length >= MIN_QUERY ? search : null;
  const waiting = trimmed.length >= MIN_QUERY && (!current || current.status === "loading");
  const results = current?.status === "done" ? current.results : [];
  const useFallback = trimmed.length < MIN_QUERY || current?.status === "error" || (current?.status === "done" && results.length === 0);
  const options = useFallback ? SAMPLE_HOTELS : results;

  return (
    <div className="space-y-2">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <input
          id={inputId}
          className={`${inputClass} pl-10`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="พิมพ์ชื่อโรงแรม เช่น Siam Kempinski"
          aria-invalid={invalid}
          autoComplete="off"
        />
        {waiting ? <Spinner className="absolute top-1/2 right-3.5 -translate-y-1/2 text-navy" /> : null}
      </div>

      {!waiting ? (
        <div className="rounded-xl border border-line bg-white">
          <p className="border-b border-line px-3 py-2 text-xs text-muted">
            {trimmed.length < MIN_QUERY
              ? "โรงแรมแนะนำ (หรือพิมพ์อย่างน้อย 3 ตัวอักษรเพื่อค้นหา)"
              : current?.status === "error"
                ? "ค้นหาไม่สำเร็จ แสดงโรงแรมตัวอย่างแทน"
                : useFallback
                  ? "ไม่พบผลลัพธ์ในกรุงเทพฯ แสดงโรงแรมตัวอย่างแทน"
                  : "ผลการค้นหาจาก OpenStreetMap"}
          </p>
          <ul className="max-h-60 overflow-y-auto">
            {options.map((place) => (
              <li key={`${place.name}-${place.lat}`}>
                <button
                  type="button"
                  onClick={() => onChange(place)}
                  className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-highlight"
                >
                  <BuildingIcon className="shrink-0 text-muted" />
                  <span className="line-clamp-2">{place.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="px-1 text-xs text-muted">กำลังค้นหา...</p>
      )}
    </div>
  );
}
