"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProduceCard, ProduceListing } from "@/components/ProduceCard";
import { getAuthHeaders } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export default function ProduceListingsPage() {
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchListings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/produce`, {
          headers: getAuthHeaders(),
        });

        if (res.status === 401) {
          console.warn("Session expired or unauthorized");
          alert("Your session has expired. Please log in again.");
          window.location.href = "/login";
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch listings (${res.status}): ${text}`);
        }

        const data = JSON.parse(await res.text());
        setListings(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load produce listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );
    if (!confirmed) return;

    const res = await fetch(`${API_BASE}/api/produce/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      alert("Failed to delete listing");
      return;
    }

    setListings((prev) => prev.filter((l) => l._id !== id));
  };

  if (loading) {
    return <div className="p-6">Loading produce listings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Produce Listings</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/produce/new">New Listing</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      <div className="space-y-3">
        {listings.map((listing) => (
          <ProduceCard
            key={listing._id}
            listing={listing}
            onEdit={() => (window.location.href = `/produce/${listing._id}/edit`)}
            onDelete={() => handleDelete(listing._id)}
          />
        ))}
        {listings.length === 0 && (
          <div className="text-sm text-zinc-500">
            You have no produce listings yet.
          </div>
        )}
      </div>
    </div>
  );
}


