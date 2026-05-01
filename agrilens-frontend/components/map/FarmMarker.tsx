"use client";

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";

type ProduceListItem = {
  produceName: string;
  quantity: number;
  harvestDate: string | null;
};

export type PublicFarm = {
  id: string;
  district: string;
  upazila: string;
  distance?: number;
  coordinates: { lat?: number; lng?: number } | null;
  produceList: ProduceListItem[];
};

const greenPinSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
  <defs>
    <filter id="s" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.35"/>
    </filter>
  </defs>
  <path filter="url(#s)" d="M18 1C10.82 1 5 6.82 5 14c0 9.25 11.34 20.74 12.02 21.42.54.54 1.42.54 1.96 0C19.66 34.74 31 23.25 31 14 31 6.82 25.18 1 18 1z" fill="#16a34a"/>
  <circle cx="18" cy="14" r="6" fill="#dcfce7"/>
</svg>
`);

const farmIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,${greenPinSvg}`,
  iconSize: [36, 48],
  iconAnchor: [18, 48],
  popupAnchor: [0, -44],
});

function formatHarvestDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

export function FarmMarker({ farm }: { farm: PublicFarm }) {
  const lat = farm.coordinates?.lat;
  const lng = farm.coordinates?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  return (
    <Marker position={[lat, lng]} icon={farmIcon}>
      <Popup>
        <div className="space-y-2">
          <div>
            <div className="text-sm font-semibold leading-snug">Produce availability</div>
            <div className="text-xs text-muted-foreground">
              {farm.district}, {farm.upazila}
            </div>
          </div>
          <div className="space-y-1">
            {farm.produceList.map((item, idx) => (
              <div key={`${item.produceName}-${item.harvestDate ?? "na"}-${idx}`} className="text-xs">
                <span className="font-medium">{item.produceName}</span>: {item.quantity}
                {formatHarvestDate(item.harvestDate) ? (
                  <span className="text-muted-foreground">
                    {" "}
                    (Harvest: {formatHarvestDate(item.harvestDate)})
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

