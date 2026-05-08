"use client";

import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export type MarketplaceListing = {
  id: string;
  produceName: string;
  category?: string;
  price: number;
  unit?: string;
  grade: number;
  availableQty: number;
  remainingQty: number;
  district: string;
  upazila?: string;
  imageUrls: string[];
  farmName: string;
  farmerBadge: boolean;
  description?: string;
};

function gradeStyles(grade: number) {
  if (grade >= 70) return "agri-badge agri-badge-approved";
  if (grade >= 40) return "agri-badge agri-badge-pending";
  return "agri-badge agri-badge-rejected";
}

function toImageSrc(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}/${path}`;
}

export default function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const thumbnail = listing.imageUrls?.[0] ? toImageSrc(listing.imageUrls[0]) : "";

  return (
    <Link href={`/marketplace/${listing.id}`} className="block">
      <article className="agri-card overflow-hidden">
        <div className="aspect-[16/10] w-full bg-[var(--agri-green-50)]">
          {thumbnail ? (
            <img src={thumbnail} alt={listing.produceName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--agri-warm-500)]">
              No image
            </div>
          )}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight text-[var(--agri-warm-900)]">{listing.produceName}</h3>
            <span className={gradeStyles(Number(listing.grade) || 0)}>
              Grade {Number(listing.grade) || 0}
            </span>
          </div>

          <p className="text-sm text-[var(--agri-warm-500)]">
            {listing.farmName || "Farm"}, {listing.district}
          </p>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--agri-warm-900)]">
              BDT {Number(listing.price || 0).toLocaleString("en-US")} / {listing.unit || "unit"}
            </p>
            <span className="agri-badge agri-badge-info">
              {listing.availableQty} {listing.unit || "unit"} left
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
