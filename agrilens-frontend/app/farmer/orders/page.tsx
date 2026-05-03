"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getAuthHeaders, getAuthUser } from "@/lib/auth";
import OrderInboxTable, { FarmerOrder } from "@/components/OrderInboxTable";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const STATUS_FILTER_OPTIONS = [
  { value: "",                 label: "All Statuses" },
  { value: "pending",          label: "⏳ Pending" },
  { value: "confirmed",        label: "✅ Confirmed" },
  { value: "packaging",        label: "📦 Packaging" },
  { value: "out_for_delivery", label: "🚚 Out for Delivery" },
  { value: "delivered",        label: "🎉 Delivered" },
  { value: "rejected",         label: "❌ Rejected" },
];

type Toast = { message: string; type: "success" | "error" };

function FarmerOrdersInner() {
  const [orders, setOrders] = useState<FarmerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  // ✅ Fix: read user ID once into a ref so it never changes reference
  // and never ends up in useCallback/useEffect deps as a volatile object.
  const userIdRef = useRef<string | null>(null);
  if (userIdRef.current === null) {
    userIdRef.current = getAuthUser()?.id ?? null;
  }

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchOrders = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(
        `${API_BASE}/api/farmer/${userId}/orders?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.orders || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch {
      showToast("Unable to load orders. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  // ✅ Fix: userIdRef.current is stable — only page/statusFilter/showToast drive re-fetches
  }, [page, statusFilter, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Optimistic update
  const handleStatusChange = useCallback((orderId: string, newStatus: string, farmerNote?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o._id !== orderId) return o;
        return {
          ...o,
          status: newStatus,
          statusHistory: [
            ...o.statusHistory,
            { status: newStatus, changedAt: new Date().toISOString() },
          ],
          farmerNote: farmerNote !== undefined ? farmerNote : o.farmerNote,
        };
      })
    );
    showToast(`Status updated to "${newStatus.replace(/_/g, " ")}"`, "success");
  }, [showToast]);

  const handleStatusError = useCallback((msg: string) => {
    fetchOrders(); // revert optimistic update
    showToast(msg, "error");
  }, [fetchOrders, showToast]);

  // Client-side sort
  const sortedOrders = [...orders].sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return sortDesc ? diff : -diff;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f0fdf4 0%,#f8fafc 60%,#f0f9ff 100%)",
        padding: "24px 16px 48px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
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
            <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              📬 Order Inbox
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
              Manage and update orders from your customers.
            </p>
          </div>
          <Link
            href="/farmer"
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              background: "#f1f5f9",
              color: "#475569",
              border: "1.5px solid #e2e8f0",
              fontSize: "0.82rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "18px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "#fff",
            border: "1.5px solid #e2e8f0",
          }}
        >
          {/* Status filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label htmlFor="farmer-orders-status-filter" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>
              Filter:
            </label>
            <select
              id="farmer-orders-status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1.5px solid #e2e8f0",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#1e293b",
                background: "#f8fafc",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSortDesc((p) => !p)}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              background: "#f1f5f9",
              border: "1.5px solid #e2e8f0",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            {sortDesc ? "↓ Newest First" : "↑ Oldest First"}
          </button>

          {/* Refresh */}
          <button
            onClick={fetchOrders}
            disabled={loading}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              background: "linear-gradient(135deg,#16a34a,#15803d)",
              color: "#fff",
              border: "none",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            🔄 Refresh
          </button>

          <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#94a3b8" }}>
            {total} order{total !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table / loading skeleton */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "52px",
                  borderRadius: "10px",
                  background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <OrderInboxTable
            orders={sortedOrders}
            onStatusChange={handleStatusChange}
            onStatusError={handleStatusError}
          />
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: "7px 16px", borderRadius: "8px",
                background: page <= 1 ? "#f1f5f9" : "#fff",
                border: "1.5px solid #e2e8f0",
                color: page <= 1 ? "#cbd5e1" : "#475569",
                fontWeight: 700, fontSize: "0.82rem", cursor: page <= 1 ? "default" : "pointer",
              }}
            >
              ← Prev
            </button>
            <span style={{ padding: "7px 14px", fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
              Page {page} of {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              style={{
                padding: "7px 16px", borderRadius: "8px",
                background: page >= pages ? "#f1f5f9" : "#fff",
                border: "1.5px solid #e2e8f0",
                color: page >= pages ? "#cbd5e1" : "#475569",
                fontWeight: 700, fontSize: "0.82rem", cursor: page >= pages ? "default" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            padding: "12px 20px",
            borderRadius: "12px",
            background: toast.type === "success"
              ? "linear-gradient(135deg,#16a34a,#15803d)"
              : "linear-gradient(135deg,#dc2626,#b91c1c)",
            color: "#fff",
            fontSize: "0.85rem",
            fontWeight: 700,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            zIndex: 10000,
            maxWidth: "340px",
          }}
        >
          {toast.type === "success" ? "✅ " : "❌ "}{toast.message}
        </div>
      )}
    </div>
  );
}

export default function FarmerOrdersPage() {
  return <FarmerOrdersInner />;
}
