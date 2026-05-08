"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getAuthHeaders, getAuthUser } from "@/lib/auth";
import OrderInboxTable, { FarmerOrder } from "@/components/OrderInboxTable";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const STATUS_FILTER_OPTIONS = [
  { value: "",                 label: "All Statuses" },
  { value: "pending",          label: "Pending" },
  { value: "confirmed",        label: "Confirmed" },
  { value: "packaging",        label: "Packaging" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered",        label: "Delivered" },
  { value: "rejected",         label: "Rejected" },
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
  }, [page, statusFilter, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
    fetchOrders(); 
    showToast(msg, "error");
  }, [fetchOrders, showToast]);

  const sortedOrders = [...orders].sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return sortDesc ? diff : -diff;
  });

  return (
    <div className="agri-page">
      <div className="agri-page-header flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <h1 className="agri-page-title">Order Inbox</h1>
          <p className="agri-page-subtitle">Manage and fulfill orders from customers</p>
        </div>
        <Link href="/farmer" className="agri-btn-outline" style={{ textDecoration: "none" }}>
          Back to Dashboard
        </Link>
      </div>

      <div className="agri-section" style={{ padding: "16px 24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", background: "#f0fdf4", border: "1.5px solid #dcfce7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label htmlFor="status-filter" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#14532d" }}>Filter:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "0.85rem", fontWeight: 600, color: "#1c1917", outline: "none", background: "#fff", cursor: "pointer" }}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setSortDesc((p) => !p)}
          className="agri-btn-outline"
          style={{ padding: "8px 16px", border: "1px solid #bbf7d0", background: "#fff" }}
        >
          {sortDesc ? "Newest First" : "Oldest First"}
        </button>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="agri-btn-primary"
          style={{ padding: "8px 16px" }}
        >
          Refresh
        </button>

        <div style={{ marginLeft: "auto", fontSize: "0.85rem", color: "#15803d", fontWeight: 600 }}>
          {total} order{total !== 1 ? "s" : ""}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="agri-skeleton" style={{ height: "64px", borderRadius: "12px" }} />
          ))}
        </div>
      ) : (
        <OrderInboxTable
          orders={sortedOrders}
          onStatusChange={handleStatusChange}
          onStatusError={handleStatusError}
        />
      )}

      {!loading && pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "32px" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="agri-btn-outline"
            style={{ padding: "8px 20px" }}
          >
            Previous
          </button>
          <span style={{ fontSize: "0.9rem", color: "#44403c", fontWeight: 600 }}>
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="agri-btn-outline"
            style={{ padding: "8px 20px" }}
          >
            Next
          </button>
        </div>
      )}

      {toast && (
        <div className={`agri-toast ${toast.type === "success" ? "agri-toast-success" : "agri-toast-error"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function FarmerOrdersPage() {
  return <FarmerOrdersInner />;
}
