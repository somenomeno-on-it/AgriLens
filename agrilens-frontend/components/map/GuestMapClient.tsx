"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, useMapEvents, Circle, useMap } from "react-leaflet";
import { FarmMarker, type PublicFarm } from "@/components/map/FarmMarker";
import { ProduceHeatmapLayer } from "@/components/map/ProduceHeatmapLayer";
import { InitialMapView } from "@/components/map/InitialMapView";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

function MapEventHandler({ setCenter }: { setCenter: (center: [number, number]) => void }) {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      setCenter([center.lat, center.lng]);
    },
  });
  return null;
}

function MapBoundsFitter({ farms, district, upazila }: { farms: PublicFarm[]; district: string; upazila: string }) {
  const map = useMap();
  useEffect(() => {
    let cancelled = false;
    let timeout: NodeJS.Timeout;

    if (farms.length > 0) {
      const bounds = L.latLngBounds([]);
      let valid = false;
      farms.forEach((f) => {
        if (typeof f.coordinates?.lat === "number" && typeof f.coordinates?.lng === "number") {
          bounds.extend([f.coordinates.lat, f.coordinates.lng]);
          valid = true;
        }
      });
      if (valid && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    } else if (district || upazila) {
      const query = [upazila, district, "Bangladesh"].filter(Boolean).join(", ");
      timeout = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
          .then((r) => r.json())
          .then((data) => {
            if (!cancelled && data && data[0]) {
              map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], upazila ? 12 : 10);
            }
          })
          .catch(console.error);
      }, 800);
    }

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [farms, map, district, upazila]);
  return null;
}

export default function GuestMapClient({
  district,
  setDistrict,
  upazila,
  setUpazila,
  radius,
  setRadius,
  mapCenter,
  setMapCenter,
}: {
  district: string;
  setDistrict: (v: string) => void;
  upazila: string;
  setUpazila: (v: string) => void;
  radius: number;
  setRadius: (v: number) => void;
  mapCenter: [number, number];
  setMapCenter: (v: [number, number]) => void;
}) {
  const [farms, setFarms] = useState<PublicFarm[]>([]);
  const [selectedProduce, setSelectedProduce] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const query = new URLSearchParams();
        if (district) query.append("district", district);
        if (upazila) query.append("upazila", upazila);
        if (radius > 0) {
          query.append("lat", mapCenter[0].toString());
          query.append("lng", mapCenter[1].toString());
          query.append("radius", radius.toString());
        }

        const res = await fetch(`${API_BASE}/api/public/farms?${query.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load farms");
        const data = (await res.json()) as PublicFarm[];
        if (!cancelled) setFarms(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    }

    const timeout = setTimeout(load, 500);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [district, upazila, radius, mapCenter]);

  return (
    <div className="flex flex-col md:flex-row guest-map-shell">
      <div className="w-full md:w-96 bg-background border-r flex flex-col shadow-lg z-10">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold mb-4">Market Insights Search</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">District</label>
              <input 
                type="text" 
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Dhaka"
                className="w-full p-2 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Upazila</label>
              <input 
                type="text" 
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                placeholder="e.g. Savar"
                className="w-full p-2 border rounded text-sm"
              />
            </div>

            <div className="pt-2 border-t">
              <label className="block text-sm font-medium mb-1">
                Distance Radius ({radius === 0 ? "Off" : `${radius} km`})
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Filters farms near map center. Combine with text filters above.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer className="h-full w-full">
          <InitialMapView center={mapCenter} zoom={7} scrollWheelZoom />
          <MapEventHandler setCenter={setMapCenter} />
          <MapBoundsFitter farms={farms} district={district} upazila={upazila} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <ProduceHeatmapLayer selectedProduce={selectedProduce} />
          
          {radius > 0 && (
            <Circle 
              center={mapCenter} 
              radius={radius * 1000} 
              pathOptions={{ color: 'var(--color-primary, #16a34a)', fillColor: 'var(--color-primary, #16a34a)', fillOpacity: 0.1, weight: 1 }}
            />
          )}

          {farms.map((farm) => (
            <FarmMarker key={farm.id} farm={farm} />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
