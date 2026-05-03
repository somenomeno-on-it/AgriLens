"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

// "rejected" is intentionally placed after "delivered" in STATUS_ORDER
// so its index is always > any non-terminal status, keeping isDisabled correct.
const STATUS_ORDER = ["pending", "confirmed", "packaging", "out_for_delivery", "delivered", "rejected"];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "confirmed",        label: "✅ Confirm" },
  { value: "packaging",        label: "📦 Packaging" },
  { value: "out_for_delivery", label: "🚚 Out for Delivery" },
  { value: "delivered",        label: "🎉 Delivered" },
  { value: "rejected",         label: "❌ Reject" },
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
  // ✅ Fix: controlled value so React always re-renders after we reset it to ""
  const [selectValue, setSelectValue] = useState("");

  const isTerminal = currentStatus === "delivered" || currentStatus === "rejected";
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  const isOptionDisabled = (optionValue: string) => {
    if (updating || isTerminal) return true;
    if (optionValue === "rejected") return false; // reject always available for non-terminal
    const optionIdx = STATUS_ORDER.indexOf(optionValue);
    return optionIdx <= currentIdx; // no backward transitions
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
    setSelectValue(""); // ✅ reset controlled value back to placeholder

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
          value={selectValue}          // ✅ controlled
          onChange={handleChange}
          disabled={updating || isTerminal}
          style={{
            padding: "6px 28px 6px 10px",
            borderRadius: "8px",
            border: "1.5px solid #e2e8f0",
            background: isTerminal ? "#f8fafc" : "#ffffff",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: isTerminal ? "#94a3b8" : "#1e293b",
            cursor: isTerminal ? "not-allowed" : "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            minWidth: "140px",
            outline: "none",
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
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            fontSize: "10px",
            color: "#94a3b8",
          }}
        >
          ▼
        </span>
      </div>

      {/* Delivery confirmation dialog */}
      {confirmDelivery && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
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
              borderRadius: "16px",
              padding: "28px 32px",
              maxWidth: "380px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "2rem", textAlign: "center", marginBottom: "12px" }}>🎉</div>
            <h3 style={{ textAlign: "center", margin: "0 0 10px", fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
              Confirm Delivery
            </h3>
            <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#475569", marginBottom: "20px" }}>
              This will mark the order as <strong>Delivered</strong> and deduct{" "}
              <strong>{orderedQty} {unit}</strong> of{" "}
              <strong>{produceName}</strong> from available inventory. Continue?
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => {
                  setConfirmDelivery(false);
                  doUpdate("delivered");
                }}
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg,#16a34a,#15803d)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Confirm Delivery
              </button>
              <button
                onClick={() => setConfirmDelivery(false)}
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1.5px solid #e2e8f0",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
