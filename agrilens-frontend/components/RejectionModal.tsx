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
        background: "rgba(28, 25, 23, 0.5)",
        backdropFilter: "blur(4px)",
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
          borderRadius: "20px",
          padding: "32px",
          maxWidth: "420px",
          width: "90%",
          boxShadow: "0 24px 48px rgba(220, 38, 38, 0.15)",
          border: "1.5px solid #fecaca",
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
          width: "56px", height: "56px", borderRadius: "50%", background: "#fef2f2", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          margin: "0 auto 20px" 
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 800, color: "#991b1b" }}>
            Reject Order
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#44403c", margin: 0, lineHeight: 1.5 }}>
            You are about to reject the order for{" "}
            <strong>{produceName}</strong>. This cannot be undone.
          </p>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            htmlFor={`rejection-note-${orderId}`}
            style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#44403c", marginBottom: "8px" }}
          >
            Reason for rejection{" "}
            <span style={{ fontWeight: 500, color: "#78716c" }}>(optional)</span>
          </label>
          <textarea
            id={`rejection-note-${orderId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Stock unavailable, cannot fulfill this quantity..."
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "1.5px solid #e7e5e4",
              padding: "12px",
              fontSize: "0.85rem",
              color: "#1c1917",
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => { 
              e.target.style.borderColor = "#dc2626"; 
              e.target.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.1)";
            }}
            onBlur={(e)  => { 
              e.target.style.borderColor = "#e7e5e4"; 
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              background: "#f5f5f4",
              color: "#44403c",
              border: "1.5px solid #e7e5e4",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#e7e5e4"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f5f5f4"}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="agri-btn-danger"
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              background: submitting ? "#fca5a5" : "#dc2626",
              color: "#fff",
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "Rejecting..." : "Reject Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
