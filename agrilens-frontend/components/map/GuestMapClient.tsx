"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, useMapEvents, Circle, useMap } from "react-leaflet";
import { FarmMarker, type PublicFarm } from "@/components/map/FarmMarker";
import { ProduceHeatmapLayer } from "@/components/map/ProduceHeatmapLayer";
import { InitialMapView } from "@/components/map/InitialMapView";
import { getDistrictOptions, getUpazilaOptionsForDistrict } from "@/src/data/bdRegions";

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

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const runInvalidate = () => map.invalidateSize({ animate: false });
    runInvalidate();

    const onWindowResize = () => {
      window.requestAnimationFrame(runInvalidate);
    };
    window.addEventListener("resize", onWindowResize);

    // React to parent layout changes (sidebar stacking, mobile browser bars, etc.)
    const container = map.getContainer().parentElement;
    const observer =
      container && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => window.requestAnimationFrame(runInvalidate))
        : null;
    if (observer && container) observer.observe(container);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      observer?.disconnect();
    };
  }, [map]);

  return null;
}

function MapBoundsFitter({
  farms,
  district,
  upazila,
  fitTriggerKey,
}: {
  farms: PublicFarm[];
  district: string;
  upazila: string;
  fitTriggerKey: string;
}) {
  const map = useMap();
  const lastFittedKeyRef = useRef<string>("");

  useEffect(() => {
    if (!fitTriggerKey || fitTriggerKey === lastFittedKeyRef.current) return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

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
        lastFittedKeyRef.current = fitTriggerKey;
      }
    } else if (district || upazila) {
      const query = [upazila, district, "Bangladesh"].filter(Boolean).join(", ");
      timeout = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
          .then((r) => r.json())
          .then((data) => {
            if (!cancelled && data && data[0]) {
              map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], upazila ? 12 : 10);
              lastFittedKeyRef.current = fitTriggerKey;
            }
          })
          .catch(console.error);
      }, 800);
    } else {
      // No location filters: mark as handled and keep user's current viewport untouched.
      lastFittedKeyRef.current = fitTriggerKey;
    }

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [farms, map, district, upazila, fitTriggerKey]);

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
  const [produceQuery, setProduceQuery] = useState("");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const districtOptions = useMemo(() => getDistrictOptions(), []);
  const upazilaOptions = useMemo(
    () => getUpazilaOptionsForDistrict(district),
    [district]
  );

  // Keep upazila consistent with chosen district
  useEffect(() => {
    setUpazila("");
  }, [district, setUpazila]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const query = new URLSearchParams();
        if (district) query.append("district", district);
        if (upazila) query.append("upazila", upazila);
        if (produceQuery.trim()) query.append("produce", produceQuery.trim());
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
  }, [district, upazila, radius, mapCenter, produceQuery]);

  const fitTriggerKey = useMemo(
    () => JSON.stringify({ district, upazila, produce: produceQuery.trim() }),
    [district, upazila, produceQuery]
  );

  const availableProduceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const f of farms) {
      for (const p of f.produceList || []) {
        if (typeof p?.produceName === "string" && p.produceName.trim()) {
          set.add(p.produceName.trim());
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [farms]);

  return (
    <div className="flex flex-col md:flex-row guest-map-shell">
      <div className="w-full md:w-96 bg-background border-r flex flex-col shadow-lg z-10">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold mb-4">Market Insights Search</h2>
          {error ? <p className="mb-3 text-xs text-red-600">{error}</p> : null}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">District</label>
              <select
                className="w-full p-2 border rounded text-sm bg-background"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="">All districts</option>
                {districtOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Upazila</label>
              <select
                className="w-full p-2 border rounded text-sm bg-background"
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                disabled={!district}
              >
                <option value="">{district ? "All upazilas" : "Select district first"}</option>
                {upazilaOptions.map((u: { value: string; label: string }) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Produce (map-based search)
              </label>
              <input
                type="text"
                value={produceQuery}
                onChange={(e) => setProduceQuery(e.target.value)}
                placeholder="e.g. Rice"
                className="w-full p-2 border rounded text-sm"
                list="produce-options"
              />
              <datalist id="produce-options">
                {availableProduceOptions.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <div className="mt-2 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    disabled={!produceQuery.trim()}
                  />
                  Crop density heatmap
                </label>
                <button
                  type="button"
                  className="text-xs underline text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setProduceQuery("");
                    setShowHeatmap(false);
                  }}
                >
                  Clear produce
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Select a produce to filter farms; enable heatmap to visualize density.
              </p>
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
          <MapResizeHandler />
          <MapBoundsFitter
            farms={farms}
            district={district}
            upazila={upazila}
            fitTriggerKey={fitTriggerKey}
          />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <ProduceHeatmapLayer
            selectedProduce={showHeatmap ? produceQuery.trim() : ""}
          />
          
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
