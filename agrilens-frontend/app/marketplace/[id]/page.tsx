"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrderForm from "@/components/OrderForm";
import type { MarketplaceListing } from "@/components/ListingCard";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

function toImageSrc(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}/${path}`;
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!params?.id) return;
    const fetchListing = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/marketplace/listings/${params.id}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          setError(payload?.message || "Listing not found.");
          setListing(null);
          return;
        }
        const data: MarketplaceListing = await res.json();
        setListing(data);
      } catch {
        setError("Failed to load listing details.");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [params?.id]);

  const activeImage = useMemo(() => listing?.imageUrls?.[activeIndex] || "", [listing, activeIndex]);

  if (loading) {
    return <div className="p-6">Loading listing details...</div>;
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-red-600">{error || "Listing not found."}</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/marketplace">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{listing.produceName}</h1>
        <Button variant="outline" asChild>
          <Link href="/marketplace">Back</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 p-4 lg:col-span-2">
          <div className="overflow-hidden rounded-md border bg-zinc-100">
            {activeImage ? (
              <img
                src={toImageSrc(activeImage)}
                alt={listing.produceName}
                className="h-[360px] w-full object-cover"
              />
            ) : (
              <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          {!!listing.imageUrls?.length && (
            <div className="grid grid-cols-4 gap-2">
              {listing.imageUrls.map((img, index) => (
                <button
                  type="button"
                  key={`${img}-${index}`}
                  onClick={() => setActiveIndex(index)}
                  className={`overflow-hidden rounded border ${
                    activeIndex === index ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <img
                    src={toImageSrc(img)}
                    alt={`${listing.produceName} ${index + 1}`}
                    className="h-20 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Farm:</span> {listing.farmName}
            </p>
            <p>
              <span className="font-medium">Location:</span> {listing.upazila}, {listing.district}
            </p>
            <p>
              <span className="font-medium">Price:</span> BDT {listing.price.toLocaleString()} /{" "}
              {listing.unit}
            </p>
            <p>
              <span className="font-medium">Grade:</span> {listing.grade}
            </p>
            <p>
              <span className="font-medium">Available:</span> {listing.remainingQty} {listing.unit}
            </p>
            <p>
              <span className="font-medium">Farmer Badge:</span>{" "}
              {listing.farmerBadge ? "Verified Farmer" : "Standard Farmer"}
            </p>
            {listing.description ? (
              <p>
                <span className="font-medium">Description:</span> {listing.description}
              </p>
            ) : null}
          </div>
        </Card>

        <div>
          <OrderForm listing={listing} />
        </div>
      </div>
    </div>
  );
}
