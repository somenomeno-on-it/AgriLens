"use client";

import { useCallback, useEffect, useState } from "react";
import CustomerRoute from "@/components/CustomerRoute";
import OrderStatusCard, { CustomerOrder } from "@/components/OrderStatusCard";
import { useInterval } from "@/hooks/useInterval";
import { getAuthHeaders, getAuthUser } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
const POLL_MS = 60_000; // 60 s

function CustomerOrdersInner() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load orders");
      const data: CustomerOrder[] = await res.json();
      setOrders(data);
      setError(null);
    } catch {
      setError("Unable to load your orders. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Poll every 60 s
  useInterval(fetchOrders, POLL_MS);

  const user = getAuthUser();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f0fdf4 0%,#f8fafc 50%,#f0f9ff 100%)",
        padding: "24px 16px 48px",
      }}
    >
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.7rem",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
              }}
            >
              📋 My Orders
            </h1>
            {user?.fullName && (
              <div style={{ fontSize: "0.83rem", color: "#64748b", marginTop: "2px" }}>
                Welcome back, {user.fullName}
              </div>
            )}
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              background: loading ? "#e2e8f0" : "linear-gradient(135deg,#16a34a,#15803d)",
              color: loading ? "#94a3b8" : "#fff",
              border: "none",
              cursor: loading ? "default" : "pointer",
              fontSize: "0.82rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>
              🔄
            </span>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Poll notice */}
        <div
          style={{
            fontSize: "0.72rem",
            color: "#94a3b8",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>⏱</span> Auto-refreshes every 60 seconds
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: "180px",
                  borderRadius: "16px",
                  background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            ))}
            <style>{`
              @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
              @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            `}</style>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "12px",
              background: "#fef2f2",
              border: "1.5px solid #fca5a5",
              color: "#dc2626",
              fontSize: "0.88rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              borderRadius: "16px",
              background: "#ffffff",
              border: "1.5px dashed #e2e8f0",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🛒</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
              No orders yet
            </div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              Browse the marketplace and place your first order!
            </div>
            <a
              href="/marketplace"
              style={{
                display: "inline-block",
                marginTop: "18px",
                padding: "10px 24px",
                borderRadius: "10px",
                background: "linear-gradient(135deg,#16a34a,#15803d)",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Go to Marketplace
            </a>
          </div>
        )}

        {/* Order list */}
        {!loading && !error && orders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
              {orders.length} order{orders.length !== 1 ? "s" : ""} · newest first
            </div>
            {orders.map((order) => (
              <OrderStatusCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerOrdersPage() {
  return (
    <CustomerRoute>
      <CustomerOrdersInner />
    </CustomerRoute>
  );
}
