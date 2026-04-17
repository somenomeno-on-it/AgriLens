"use client";

import { useEffect, useState } from "react";
import { getAdminHeaders, API_BASE } from "@/lib/adminApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export default function ModerationQueue() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Custom dialog state
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFlagged = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/moderation/flagged`, {
        headers: getAdminHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setListings(data.data || []);
    } catch (err) {
      setError("Failed to load flagged listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlagged();
  }, []);

  const openRemoveDialog = (id: string) => {
    setSelectedListingId(id);
    setRemoveReason("");
    setIsRemoveDialogOpen(true);
  };

  const closeRemoveDialog = () => {
    setIsRemoveDialogOpen(false);
    setSelectedListingId(null);
  };

  const handleRemove = async () => {
    if (!selectedListingId || !removeReason.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/listings/${selectedListingId}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason: removeReason }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      setListings((prev) => prev.filter((l) => l.id !== selectedListingId));
      closeRemoveDialog();
    } catch (err) {
      alert("Failed to remove listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReinstate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/listings/${id}/reinstate`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason: "Unflagged by admin" }),
      });
      if (!res.ok) throw new Error("Failed to reinstate");
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert("Failed to reinstate listing");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Moderation Queue</h1>
      <p className="text-muted-foreground text-sm">Listings flagged by agents for admin review.</p>

      {error && <div className="text-red-600 bg-red-100 p-3 rounded">{error}</div>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-4 text-left font-medium">Crop</th>
              <th className="p-4 text-left font-medium">Farmer</th>
              <th className="p-4 text-left font-medium">Flagged On</th>
              <th className="p-4 text-left font-medium">Flag Reason</th>
              <th className="p-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">No flagged listings pending review.</td>
              </tr>
            ) : (
              listings.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4">{l.cropType}</td>
                  <td className="p-4">{l.farmerId?.fullName || "Unknown"}</td>
                  <td className="p-4">{l.flaggedAt ? new Date(l.flaggedAt).toLocaleDateString() : ""}</td>
                  <td className="p-4 italic text-red-600/80">{l.flagReason}</td>
                  <td className="p-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleReinstate(l.id)}>
                      Dismiss Flag
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openRemoveDialog(l.id)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {isRemoveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background border rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold mb-4">Remove Listing</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for removing this listing. This will be logged.
            </p>
            <textarea
              className="w-full min-h-[100px] p-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Reason for removal..."
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={closeRemoveDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemove} disabled={!removeReason.trim() || isSubmitting}>
                {isSubmitting ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
