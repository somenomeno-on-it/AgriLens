"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"sold" | "reserved">("sold");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (showPopup && popupRef.current && !popupRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest(`.inventory-update-btn-${listing._id}`)) {
          setShowPopup(false);
        }
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showPopup, listing._id]);

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

  const handleUpdate = async () => {
    const numAmount = Number(amount);
    if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await updateInventory(listing._id, numAmount, type);
      window.location.reload();
    } catch (err) {
      setError("Failed to update inventory");
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between overflow-visible">
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
      <div className="flex flex-col gap-2 self-start md:self-auto items-end md:items-start relative">
        <div className="flex gap-2 w-full justify-end md:justify-start">
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

        <div className="flex flex-col gap-1 w-full relative">
          <Button
            className={`inventory-update-btn-${listing._id} w-full md:w-auto`}
            variant="outline"
            size="sm"
            onClick={() => {
              if (canUpdateInventory) {
                setShowPopup((v) => !v);
                setError("");
                setAmount("");
                setType("sold");
              }
            }}
            disabled={!canUpdateInventory}
          >
            Sold / Reserved
          </Button>

          {!canUpdateInventory && (
            <span className="text-[10px] sm:text-xs text-muted-foreground text-center md:text-left md:max-w-[140px] leading-tight">
              Inventory can only be updated after approval.
            </span>
          )}

          {showPopup && (
            <div
              ref={popupRef}
              className="absolute right-0 top-full mt-2 w-[280px] z-[50] rounded-xl border bg-background p-4 shadow-md md:right-0"
            >
              <div className="text-sm font-semibold mb-3">Update Inventory</div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Type
                  </label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`inventoryType-${listing._id}`}
                        value="sold"
                        checked={type === "sold"}
                        onChange={() => setType("sold")}
                        className="accent-primary"
                      />
                      Sold
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`inventoryType-${listing._id}`}
                        value="reserved"
                        checked={type === "reserved"}
                        onChange={() => setType("reserved")}
                        className="accent-primary"
                      />
                      Reserved
                    </label>
                  </div>
                </div>

                {error && <div className="text-xs text-red-600">{error}</div>}

                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPopup(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleUpdate} disabled={loading}>
                    {loading ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}


