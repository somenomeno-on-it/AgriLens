"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { FarmMarker, type PublicFarm } from "@/components/map/FarmMarker";
import { ProduceHeatmapLayer } from "@/components/map/ProduceHeatmapLayer";
import { ProduceSelector } from "@/components/map/ProduceSelector";
import { InitialMapView } from "@/components/map/InitialMapView";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export default function GuestMapClient() {
  const [farms, setFarms] = useState<PublicFarm[]>([]);
  const [selectedProduce, setSelectedProduce] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      const res = await fetch(`${API_BASE}/api/public/farms`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load farms");
      const data = (await res.json()) as PublicFarm[];
      if (!cancelled) setFarms(Array.isArray(data) ? data : []);
    }

    load().catch((e) => {
      if (!cancelled)
        setError(e instanceof Error ? e.message : "Failed to load");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const produceNames = useMemo(() => {
    const set = new Set<string>();
    for (const farm of farms) {
      for (const p of farm.produceList || []) {
        if (typeof p.produceName === "string" && p.produceName.trim()) {
          set.add(p.produceName.trim());
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [farms]);

  return (
    <div className="guest-map-shell">
      <ProduceSelector
        produceNames={produceNames}
        selectedProduce={selectedProduce}
        onChange={setSelectedProduce}
      />

      {error ? (
        <div className="absolute left-3 top-16 z-[1000] rounded-md border bg-background px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <MapContainer className="guest-map-container">
        <InitialMapView center={[23.8, 90.4]} zoom={7} scrollWheelZoom />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <ProduceHeatmapLayer selectedProduce={selectedProduce} />

        {farms.map((farm) => (
          <FarmMarker key={farm.id} farm={farm} />
        ))}
      </MapContainer>
    </div>
  );
}

