"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export function InitialMapView({
  center,
  zoom,
  scrollWheelZoom = true,
}: {
  center: [number, number];
  zoom: number;
  scrollWheelZoom?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
    if (scrollWheelZoom) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
    // only run once per map instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

