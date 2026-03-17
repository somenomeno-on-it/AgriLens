"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhotoGallery } from "@/components/PhotoGallery";
import { updateInventory } from "@/services/inventoryService";

export type ProduceStatus = "pending" | "approved" | "rejected";

export type ProduceListing = {
  _id: string;
  cropType: string;
  quantity: number; // available quantity
  unit: string;
  expectedHarvestDate?: string;
  status: ProduceStatus;
  photos?: string[];
  initialQuantity?: number;
  soldQuantity?: number;
  reservedQuantity?: number;
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

  const initial =
    typeof listing.initialQuantity === "number"
      ? listing.initialQuantity
      : listing.quantity;

  const sold = listing.soldQuantity ?? 0;
  const reserved = listing.reservedQuantity ?? 0;

  const canUpdateInventory = listing.status === "approved";

  const handleSoldReserved = async () => {
    if (!canUpdateInventory) return;

    const amountInput = window.prompt("Enter amount");
    if (amountInput == null) return;

    const amount = Number(amountInput);
    if (!amountInput || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    const typeInput = window.prompt(
      'Type "sold" for sold inventory or "reserved" for reserved inventory'
    );

    if (typeInput == null) return;

    const normalized = typeInput.trim().toLowerCase();
    if (normalized !== "sold" && normalized !== "reserved") {
      alert('Invalid type. Please enter "sold" or "reserved".');
      return;
    }

    try {
      await updateInventory(listing._id, amount, normalized);
      window.location.reload();
    } catch (err) {
      alert("Failed to update inventory");
    }
  };

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
          Available: {listing.quantity} {listing.unit}
        </div>
        <div className="text-sm text-zinc-600">
          Expected harvest: {harvestLabel}
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          Inventory — Initial: {initial} {listing.unit}, Sold: {sold}{" "}
          {listing.unit}, Reserved: {reserved} {listing.unit}
        </div>
        {listing.photos && listing.photos.length > 0 && (
          <PhotoGallery photos={listing.photos} />
        )}
      </div>
      <div className="flex flex-col gap-2 self-start md:self-auto">
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSoldReserved}
            disabled={!canUpdateInventory}
          >
            Sold / Reserved
          </Button>

        </div>
      </div>
    </Card>
  );
}


