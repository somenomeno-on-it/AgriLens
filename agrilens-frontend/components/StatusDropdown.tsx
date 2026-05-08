"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const STATUS_ORDER = ["pending", "confirmed", "packaging", "out_for_delivery", "delivered", "rejected"];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "confirmed",        label: "Confirm Order" },
  { value: "packaging",        label: "Start Packaging" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered",        label: "Mark Delivered" },
  { value: "rejected",         label: "Reject Order" },
];

type Props = {
  orderId: string;
  currentStatus: string;
  produceName: string;
  orderedQty: number;
  unit: string;
  onSuccess: (orderId: string, newStatus: string, farmerNote?: string) => void;
  onError: (msg: string) => void;
  onReject: (orderId: string) => void;
};

export default function StatusDropdown({
  orderId,
  currentStatus,
  produceName,
  orderedQty,
  unit,
  onSuccess,
  onError,
  onReject,
}: Props) {
  const [updating, setUpdating] = useState(false);
  const [confirmDelivery, setConfirmDelivery] = useState(false);
  const [selectValue, setSelectValue] = useState("");

  const isTerminal = currentStatus === "delivered" || currentStatus === "rejected";
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  const isOptionDisabled = (optionValue: string) => {
    if (updating || isTerminal) return true;
    if (optionValue === "rejected") return false;
    const optionIdx = STATUS_ORDER.indexOf(optionValue);
    return optionIdx <= currentIdx;
  };

  const doUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        onError(err.message || "Failed to update status");
        return;
      }
      onSuccess(orderId, newStatus);
    } catch {
      onError("Network error — please try again");
    } finally {
      setUpdating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setSelectValue("");

    if (!newStatus) return;

    if (newStatus === "rejected") {
      onReject(orderId);
      return;
    }

    if (newStatus === "delivered") {
      setConfirmDelivery(true);
      return;
    }

    doUpdate(newStatus);
  };

  return (
    <>
      <div style={{ position: "relative", display: "inline-block" }}>
        <select
          id={`status-dropdown-${orderId}`}
          value={selectValue}
          onChange={handleChange}
          disabled={updating || isTerminal}
          style={{
            padding: "8px 30px 8px 12px",
            borderRadius: "8px",
            border: "1.5px solid #bbf7d0",
            background: isTerminal ? "#f9fafb" : "#ffffff",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: isTerminal ? "#a8a29e" : "#1c1917",
            cursor: isTerminal ? "not-allowed" : "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            minWidth: "150px",
            outline: "none",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 3px rgba(22, 163, 74, 0.05)",
          }}
          onFocus={(e) => {
            if (!isTerminal) {
              e.target.style.borderColor = "#16a34a";
              e.target.style.boxShadow = "0 0 0 3px rgba(22, 163, 74, 0.1)";
            }
          }}
          onBlur={(e) => {
            if (!isTerminal) {
              e.target.style.borderColor = "#bbf7d0";
              e.target.style.boxShadow = "0 1px 3px rgba(22, 163, 74, 0.05)";
            }
          }}
        >
          <option value="" disabled>
            {updating ? "Updating…" : "Change status"}
          </option>
          {STATUS_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={isOptionDisabled(opt.value)}
            >
              {opt.label}
            </option>
          ))}
        </select>
        <span
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "#16a34a",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {confirmDelivery && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28, 25, 23, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9000,
          }}
          onClick={() => setConfirmDelivery(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 24px 48px rgba(22, 163, 74, 0.15)",
              border: "1.5px solid #dcfce7",
              animation: "agri-modal-in 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes agri-modal-in {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>
            
            <div style={{ 
              width: "56px", height: "56px", borderRadius: "50%", background: "#dcfce7", 
              display: "flex", alignItems: "center", justifyContent: "center", 
              margin: "0 auto 20px" 
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            
            <h3 style={{ textAlign: "center", margin: "0 0 12px", fontSize: "1.2rem", fontWeight: 800, color: "#14532d" }}>
              Confirm Delivery
            </h3>
            <p style={{ textAlign: "center", fontSize: "0.9rem", color: "#44403c", marginBottom: "24px", lineHeight: 1.5 }}>
              This will mark the order as <strong>Delivered</strong> and deduct{" "}
              <strong style={{ color: "#16a34a" }}>{orderedQty} {unit}</strong> of{" "}
              <strong style={{ color: "#16a34a" }}>{produceName}</strong> from available inventory. Continue?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDelivery(false)}
                className="agri-btn-outline"
                style={{ flex: 1, padding: "10px" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmDelivery(false);
                  doUpdate("delivered");
                }}
                className="agri-btn-primary"
                style={{ flex: 1, padding: "10px" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
