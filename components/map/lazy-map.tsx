"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";

/** Leaflet touches `window`, so the map only ever renders in the browser. */
export const TrackingMap = dynamic(() => import("@/components/map/tracking-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full" />,
});
