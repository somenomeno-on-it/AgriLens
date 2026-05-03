"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type Props = {
  orderId: string;
  produceName: string;
  onSuccess: (orderId: string, farmerNote: string) => void;
  onError: (msg: string) => void;
  onClose: () => void;
};

export default function RejectionModal({ orderId, produceName, onSuccess, onError, onClose }: Props) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "rejected", farmerNote: note.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        onError(err.message || "Failed to reject order");
        return;
      }
      onSuccess(orderId, note.trim());
      onClose();
    } catch {
      onError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "18px",
          padding: "28px 32px",
          maxWidth: "420px",
          width: "92%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          animation: "modalIn 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity:0; transform:scale(0.93) translateY(10px); }
            to   { opacity:1; transform:scale(1)    translateY(0);    }
          }
        `}</style>

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "2.2rem" }}>❌</div>
          <h3 style={{ margin: "8px 0 4px", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
            Reject Order
          </h3>
          <p style={{ fontSize: "0.83rem", color: "#64748b", margin: 0 }}>
            You are about to reject the order for{" "}
            <strong>{produceName}</strong>. This cannot be undone.
          </p>
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label
            htmlFor={`rejection-note-${orderId}`}
            style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}
          >
            Reason for rejection{" "}
            <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
          </label>
          <textarea
            id={`rejection-note-${orderId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Stock unavailable, cannot fulfil this quantity…"
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "1.5px solid #e2e8f0",
              padding: "10px 12px",
              fontSize: "0.83rem",
              color: "#1e293b",
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#dc2626"; }}
            onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              background: submitting
                ? "#e2e8f0"
                : "linear-gradient(135deg,#dc2626,#b91c1c)",
              color: submitting ? "#94a3b8" : "#fff",
              border: "none",
              fontWeight: 800,
              fontSize: "0.88rem",
              cursor: submitting ? "default" : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {submitting ? "Rejecting…" : "Confirm Rejection"}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              background: "#f1f5f9",
              color: "#475569",
              border: "1.5px solid #e2e8f0",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
