"use client";

import { useState, useRef, useEffect } from "react";
import { PhotoGallery } from "@/components/PhotoGallery";
import { updateInventory } from "@/services/inventoryService";

export type ProduceStatus = "pending" | "approved" | "rejected";

export type ProduceListing = {
  _id: string;
  cropType: string;
  quantity: number;
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
    ? new Date(listing.expectedHarvestDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : "Not specified";

  const initial = typeof listing.initialQuantity === "number" ? listing.initialQuantity : listing.quantity;
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
    } catch {
      setError("Failed to update inventory");
      setLoading(false);
    }
  };

  const statusClass = `agri-badge agri-badge-${listing.status}`;
  const statusIcon = listing.status === "approved" ? "✅" : listing.status === "rejected" ? "❌" : "⏳";

  return (
    <div className="agri-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#14532d", margin: 0 }}>{listing.cropType}</h3>
            <span className={statusClass}>
              {statusIcon} {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </span>
          </div>
          <div style={{ fontSize: "0.85rem", color: "#44403c", display: "flex", gap: "16px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="20" x="8" y="2" rx="4" ry="4"/><line x1="16" y1="14" x2="22" y2="14"/><line x1="2" y1="14" x2="8" y2="14"/><line x1="4" y1="18" x2="8" y2="18"/><line x1="16" y1="18" x2="20" y2="18"/></svg>
              Available: <strong style={{ color: "#1c1917" }}>{listing.quantity} {listing.unit}</strong>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Harvest: {harvestLabel}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          {onEdit && <button onClick={onEdit} className="agri-btn-outline" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>Edit</button>}
          {onDelete && <button onClick={onDelete} className="agri-btn-danger" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>Delete</button>}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", borderTop: "1px solid #f5f5f4", paddingTop: "16px" }}>
        
        {/* Inventory Stats Row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ background: "#f5f5f4", padding: "10px 14px", borderRadius: "10px", flex: 1, minWidth: "120px" }}>
            <div style={{ fontSize: "0.7rem", color: "#78716c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Initial</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1c1917", marginTop: "2px" }}>{initial} <span style={{ fontSize: "0.8rem", color: "#78716c", fontWeight: 500 }}>{listing.unit}</span></div>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "10px", flex: 1, minWidth: "120px" }}>
            <div style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Sold</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#14532d", marginTop: "2px" }}>{sold} <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 500 }}>{listing.unit}</span></div>
          </div>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "10px 14px", borderRadius: "10px", flex: 1, minWidth: "120px" }}>
            <div style={{ fontSize: "0.7rem", color: "#d97706", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Reserved</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#92400e", marginTop: "2px" }}>{reserved} <span style={{ fontSize: "0.8rem", color: "#d97706", fontWeight: 500 }}>{listing.unit}</span></div>
          </div>
          
          {/* Update Inventory Control */}
          <div style={{ position: "relative", alignSelf: "flex-end" }}>
            <button
              className={`agri-btn-outline inventory-update-btn-${listing._id}`}
              onClick={() => {
                if (canUpdateInventory) {
                  setShowPopup((v) => !v);
                  setError(""); setAmount(""); setType("sold");
                }
              }}
              disabled={!canUpdateInventory}
              style={{ height: "100%", minHeight: "56px" }}
            >
              Update Stock
            </button>

            {showPopup && (
              <div ref={popupRef} style={{ position: "absolute", bottom: "calc(100% + 12px)", right: 0, width: "280px", zIndex: 50, background: "#fff", borderRadius: "16px", border: "1.5px solid #dcfce7", padding: "20px", boxShadow: "0 12px 32px rgba(22,163,74,0.12)" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#14532d", marginBottom: "16px" }}>Adjust Inventory</div>
                
                <div className="agri-field" style={{ marginBottom: "12px" }}>
                  <label className="agri-label">Quantity</label>
                  <input type="number" placeholder={`Amount in ${listing.unit}`} value={amount} onChange={(e) => setAmount(e.target.value)} style={{ height: "40px", borderRadius: "8px", border: "1px solid #bbf7d0", padding: "0 12px", width: "100%", outline: "none" }} />
                </div>

                <div className="agri-field" style={{ marginBottom: "16px" }}>
                  <label className="agri-label">Action</label>
                  <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer", color: "#44403c", fontWeight: 500 }}>
                      <input type="radio" name={`inv-${listing._id}`} value="sold" checked={type === "sold"} onChange={() => setType("sold")} style={{ accentColor: "#16a34a" }} /> Mark Sold
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer", color: "#44403c", fontWeight: 500 }}>
                      <input type="radio" name={`inv-${listing._id}`} value="reserved" checked={type === "reserved"} onChange={() => setType("reserved")} style={{ accentColor: "#d97706" }} /> Mark Reserved
                    </label>
                  </div>
                </div>

                {error && <div style={{ fontSize: "0.75rem", color: "#dc2626", marginBottom: "12px", padding: "8px", background: "#fef2f2", borderRadius: "6px" }}>{error}</div>}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button onClick={() => setShowPopup(false)} disabled={loading} style={{ padding: "6px 12px", borderRadius: "8px", background: "#f5f5f4", border: "none", color: "#44403c", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleUpdate} disabled={loading} className="agri-btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>{loading ? "Saving..." : "Save"}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {!canUpdateInventory && (
          <div style={{ fontSize: "0.75rem", color: "#a8a29e", fontStyle: "italic", marginTop: "-12px" }}>
            * Inventory adjustments available after listing approval
          </div>
        )}

        {/* Photo Gallery Area */}
        {listing.photos && listing.photos.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <PhotoGallery photos={listing.photos} />
          </div>
        )}

      </div>
    </div>
  );
}
