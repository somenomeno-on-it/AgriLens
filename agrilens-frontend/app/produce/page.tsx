"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

        if (res.status === 401 || res.status === 403) {
          console.warn("Session expired or unauthorized");
          alert(res.status === 403 ? "You do not have permission to view this page. This page is for farmers only." : "Your session has expired. Please log in again.");
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
    return (
      <div className="agri-page space-y-6">
        <div className="agri-page-header">
          <div className="agri-skeleton" style={{ height: "40px", width: "240px", marginBottom: "8px" }} />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="agri-skeleton" style={{ height: "160px", borderRadius: "16px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="agri-page space-y-6">
      <div className="agri-page-header flex items-center justify-between">
        <div>
          <h1 className="agri-page-title">My Produce Listings</h1>
          <p className="agri-page-subtitle">Manage the produce you are selling</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/produce/new" className="agri-btn-primary" style={{ textDecoration: "none" }}>
            + New Listing
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {listings.map((listing) => (
          <ProduceCard
            key={listing._id}
            listing={listing}
            onEdit={() => (window.location.href = `/produce/${listing._id}/edit`)}
            onDelete={() => handleDelete(listing._id)}
          />
        ))}
        {listings.length === 0 && (
          <div className="agri-empty">
            <div className="agri-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="agri-empty-title">No produce listings yet</h3>
            <p className="agri-empty-text">Start selling by adding your first agricultural product</p>
            <Link href="/produce/new" className="agri-btn-outline" style={{ display: "inline-block", marginTop: "16px", textDecoration: "none" }}>
              Add First Listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
