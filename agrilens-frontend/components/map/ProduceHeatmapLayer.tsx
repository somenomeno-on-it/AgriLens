"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

type HeatPoint = {
  lat: number;
  lng: number;
  intensity: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export function ProduceHeatmapLayer({
  selectedProduce,
  district,
  upazila,
  radius,
  mapCenter,
}: {
  selectedProduce: string;
  district?: string;
  upazila?: string;
  radius?: number;
  mapCenter?: [number, number];
}) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  const centerKey = mapCenter ? `${mapCenter[0]},${mapCenter[1]}` : "";

  useEffect(() => {
    let isCancelled = false;

    async function run() {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }

      if (!selectedProduce) return;

      const url = new URL(`${API_BASE}/api/public/heatmap`);
      url.searchParams.set("produce", selectedProduce);
      if (district) url.searchParams.set("district", district);
      if (upazila) url.searchParams.set("upazila", upazila);
      if (radius && radius > 0 && mapCenter) {
        url.searchParams.set("radius", radius.toString());
        url.searchParams.set("lat", mapCenter[0].toString());
        url.searchParams.set("lng", mapCenter[1].toString());
      }

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        return;
      }

      const points = (await res.json()) as HeatPoint[];
      if (isCancelled) return;

      const heatData: [number, number, number][] = points.map((p) => [
        p.lat,
        p.lng,
        p.intensity,
      ]);

      const anyL = L as unknown as {
        heatLayer: (
          latlngs: [number, number, number][],
          options: Record<string, unknown>
        ) => L.Layer;
      };

      const layer = anyL.heatLayer(heatData, {
        radius: 25,
        blur: 18,
        maxZoom: 12,
        gradient: {
          0.2: "#22c55e",
          0.55: "#eab308",
          1.0: "#ef4444",
        },
      });

      layer.addTo(map);
      layerRef.current = layer;
    }

    run().catch(() => {});

    return () => {
      isCancelled = true;
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, selectedProduce, district, upazila, radius, centerKey]);

  return null;
}

