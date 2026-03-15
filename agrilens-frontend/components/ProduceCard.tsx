"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhotoGallery } from "@/components/PhotoGallery";

export type ProduceStatus = "pending" | "approved" | "rejected";

export type ProduceListing = {
  _id: string;
  cropType: string;
  quantity: number;
  unit: string;
  expectedHarvestDate?: string;
  status: ProduceStatus;
  photos?: string[];
};

type Props = {
  listing: ProduceListing;
  onEdit?: () => void;
  onDelete?: () => void;
};

function statusStyles(status: ProduceStatus) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "pending":
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

export function ProduceCard({ listing, onEdit, onDelete }: Props) {
  const harvestLabel = listing.expectedHarvestDate
    ? new Date(listing.expectedHarvestDate).toLocaleDateString()
    : "N/A";

  return (
    <Card className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{listing.cropType}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusStyles(
              listing.status
            )}`}
          >
            {listing.status}
          </span>
        </div>
        <div className="text-sm text-zinc-600 mt-1">
          Quantity: {listing.quantity} {listing.unit}
        </div>
        <div className="text-sm text-zinc-600">
          Expected harvest: {harvestLabel}
        </div>
        {listing.photos && listing.photos.length > 0 && (
          <PhotoGallery photos={listing.photos} />
        )}
      </div>
      <div className="flex gap-2 self-start md:self-auto">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </Card>
  );
}


