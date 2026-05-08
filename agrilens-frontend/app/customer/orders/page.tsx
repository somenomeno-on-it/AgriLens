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
    <div className="agri-customer-shell">
      <div className="agri-page" style={{ maxWidth: "920px" }}>
        {/* Page header */}
        <div className="agri-hero" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 className="agri-page-title">My Orders</h1>
            {user?.fullName && (
              <div style={{ fontSize: "0.83rem", color: "var(--agri-warm-500)", marginTop: "2px" }}>
                Welcome back, {user.fullName}
              </div>
            )}
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="agri-btn-primary"
            style={{ opacity: loading ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span style={{ display: "inline-flex", animation: loading ? "spin 1s linear infinite" : "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
            </span>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Poll notice */}
        <div style={{ fontSize: "0.75rem", color: "var(--agri-warm-500)", marginTop: "10px" }}>
          Auto-refreshes every 60 seconds
        </div>
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
                  background: "linear-gradient(90deg,#f0fdf4 25%,#dcfce7 50%,#f0fdf4 75%)",
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
          <div className="agri-alert agri-alert-error">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div className="agri-empty">
            <div className="agri-empty-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.5 12.5a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.2-6.4H6.2" />
              </svg>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--agri-warm-700)", marginBottom: "6px" }}>
              No orders yet
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--agri-warm-500)" }}>
              Browse the marketplace and place your first order!
            </div>
            <a
              href="/marketplace"
              className="agri-btn-primary"
              style={{ display: "inline-block", marginTop: "18px", textDecoration: "none" }}
            >
              Go to Marketplace
            </a>
          </div>
        )}

        {/* Order list */}
        {!loading && !error && orders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--agri-warm-500)", fontWeight: 600 }}>
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
