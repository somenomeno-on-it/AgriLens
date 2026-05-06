"use client";

import { useEffect, useMemo, useState } from "react";
import ListingCard, { MarketplaceListing } from "@/components/ListingCard";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export default function MarketplacePage() {
  const [allListings, setAllListings] = useState<MarketplaceListing[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  const [crop, setCrop] = useState("");
  const [district, setDistrict] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minGrade, setMinGrade] = useState(0);
  const [maxGrade, setMaxGrade] = useState(100);

  useEffect(() => {
    const loadAllListings = async () => {
      try {
        const params = new URLSearchParams();
        params.set("limit", "200");
        const res = await fetch(`${API_BASE}/api/marketplace/listings?${params.toString()}`);
        if (!res.ok) {
          setAllListings([]);
          return;
        }
        const payload = await res.json();
        setAllListings(payload?.listings || []);
      } catch {
        setAllListings([]);
      }
    };

    loadAllListings();
  }, []);

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", "200");
        if (crop) params.set("crop", crop);
        if (district) params.set("district", district);
        params.set("minPrice", String(minPrice));
        params.set("maxPrice", String(maxPrice));
        params.set("minGrade", String(minGrade));
        params.set("maxGrade", String(maxGrade));

        const res = await fetch(`${API_BASE}/api/marketplace/listings?${params.toString()}`);
        if (!res.ok) {
          setListings([]);
          return;
        }
        const payload = await res.json();
        setListings(payload?.listings || []);
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, [crop, district, minPrice, maxPrice, minGrade, maxGrade]);

  const cropOptions = useMemo(
    () => Array.from(new Set(allListings.map((item) => item.produceName).filter(Boolean))).sort(),
    [allListings]
  );

  const districtOptions = useMemo(
    () => Array.from(new Set(allListings.map((item) => item.district).filter(Boolean))).sort(),
    [allListings]
  );

  return (
    <div className="p-6">
      <div className="mb-6 w-full rounded-xl border bg-white p-4 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">Marketplace</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Crop</label>
            <select
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
            >
              <option value="">All crops</option>
              {cropOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">District</label>
            <select
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">All districts</option>
              {districtOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Price Range: {minPrice} - {maxPrice} BDT
            </label>
            <input
              type="range"
              min={0}
              max={10000}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
              className="w-full"
            />
            <input
              type="range"
              min={0}
              max={10000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Grade Range: {minGrade} - {maxGrade}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={minGrade}
              onChange={(e) => setMinGrade(Math.min(Number(e.target.value), maxGrade))}
              className="w-full"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={maxGrade}
              onChange={(e) => setMaxGrade(Math.max(Number(e.target.value), minGrade))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading listings...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
          {!listings.length && (
            <div className="col-span-full rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No listings match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
