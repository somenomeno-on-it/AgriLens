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
    <div className="agri-customer-shell">
      <div className="agri-page">
      <div className="agri-hero mb-6 w-full">
        <h1 className="agri-page-title">Marketplace</h1>
        <p className="agri-page-subtitle">Discover verified fresh produce across Bangladesh.</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="agri-label">Crop</label>
            <select
              className="agri-select"
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
            <label className="agri-label">District</label>
            <select
              className="agri-select"
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
            <label className="agri-label">
              Price Range: {minPrice} - {maxPrice} BDT
            </label>
            <input
              type="range"
              min={0}
              max={10000}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
              className="agri-range"
            />
            <input
              type="range"
              min={0}
              max={10000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
              className="agri-range"
            />
          </div>

          <div className="space-y-2">
            <label className="agri-label">
              Grade Range: {minGrade} - {maxGrade}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={minGrade}
              onChange={(e) => setMinGrade(Math.min(Number(e.target.value), maxGrade))}
              className="agri-range"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={maxGrade}
              onChange={(e) => setMaxGrade(Math.max(Number(e.target.value), minGrade))}
              className="agri-range"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="agri-skeleton" style={{ height: "290px", borderRadius: "16px" }} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
          {!listings.length && (
            <div className="agri-empty col-span-full">
              No listings match your filters.
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
