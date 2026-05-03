"use client";

import { useState } from "react";
import StatusDropdown from "@/components/StatusDropdown";
import RejectionModal from "@/components/RejectionModal";

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:          { label: "Pending",         bg: "#fef9c3", color: "#a16207" },
  confirmed:        { label: "Confirmed",       bg: "#dcfce7", color: "#15803d" },
  packaging:        { label: "Packaging",       bg: "#dbeafe", color: "#1d4ed8" },
  out_for_delivery: { label: "Out for Delivery",bg: "#ede9fe", color: "#6d28d9" },
  delivered:        { label: "Delivered",       bg: "#d1fae5", color: "#065f46" },
  rejected:         { label: "Rejected",        bg: "#fee2e2", color: "#dc2626" },
};

export type FarmerOrder = {
  _id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  produceName: string;
  orderedQty: number;
  unit: string;
  priceAtOrder: number;
  status: string;
  statusHistory: { status: string; changedAt: string }[];
  farmerNote?: string;
  createdAt: string;
};

type Props = {
  orders: FarmerOrder[];
  onStatusChange: (orderId: string, newStatus: string, farmerNote?: string) => void;
  onStatusError: (msg: string) => void;
};

export default function OrderInboxTable({ orders, onStatusChange, onStatusError }: Props) {
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  const rejectOrder = orders.find((o) => o._id === rejectTargetId);

  if (orders.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 20px",
          borderRadius: "14px",
          background: "#fff",
          border: "1.5px dashed #e2e8f0",
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#374151" }}>No orders found</div>
        <div style={{ fontSize: "0.83rem", color: "#94a3b8", marginTop: "4px" }}>
          Orders from customers will appear here once placed.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Scrollable table wrapper */}
      <div style={{ overflowX: "auto", borderRadius: "14px", border: "1.5px solid #e2e8f0" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
            fontSize: "0.82rem",
          }}
        >
          <thead>
            <tr style={{ background: "linear-gradient(135deg,#f0fdf4,#f8fafc)" }}>
              {[
                "Customer",
                "Produce",
                "Qty",
                "Phone",
                "Delivery Address",
                "Order Date",
                "Status",
                "Action",
              ].map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1.5px solid #e2e8f0",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => {
              const badge = STATUS_BADGE[order.status] ?? { label: order.status, bg: "#f1f5f9", color: "#64748b" };
              const orderDate = new Date(order.createdAt).toLocaleDateString("en-BD", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <tr
                  key={order._id}
                  style={{
                    background: idx % 2 === 0 ? "#ffffff" : "#fafafa",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#f0fdf4"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? "#ffffff" : "#fafafa"; }}
                >
                  {/* Customer Name */}
                  <td style={{ padding: "12px 14px", color: "#1e293b", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>
                    <div>{order.customerName}</div>
                  </td>

                  {/* Produce */}
                  <td style={{ padding: "12px 14px", color: "#0f172a", fontWeight: 700, borderBottom: "1px solid #f1f5f9" }}>
                    {order.produceName}
                  </td>

                  {/* Qty */}
                  <td style={{ padding: "12px 14px", color: "#1e293b", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                    {order.orderedQty} {order.unit}
                  </td>

                  {/* Phone */}
                  <td style={{ padding: "12px 14px", color: "#475569", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                    {order.customerPhone}
                  </td>

                  {/* Delivery Address */}
                  <td style={{ padding: "12px 14px", color: "#475569", borderBottom: "1px solid #f1f5f9", maxWidth: "180px" }}>
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "180px",
                      }}
                      title={order.deliveryAddress}
                    >
                      {order.deliveryAddress}
                    </div>
                  </td>

                  {/* Order Date */}
                  <td style={{ padding: "12px 14px", color: "#64748b", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                    {orderDate}
                  </td>

                  {/* Status badge */}
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        background: badge.bg,
                        color: badge.color,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {badge.label}
                    </span>
                    {order.farmerNote && order.status === "rejected" && (
                      <div
                        style={{ fontSize: "0.68rem", color: "#ef4444", marginTop: "3px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={order.farmerNote}
                      >
                        📝 {order.farmerNote}
                      </div>
                    )}
                  </td>

                  {/* Action dropdown */}
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9" }}>
                    <StatusDropdown
                      orderId={order._id}
                      currentStatus={order.status}
                      produceName={order.produceName}
                      orderedQty={order.orderedQty}
                      unit={order.unit}
                      onSuccess={(id, newStatus, farmerNote) => onStatusChange(id, newStatus, farmerNote)}
                      onError={onStatusError}
                      onReject={(id) => setRejectTargetId(id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rejection modal */}
      {rejectTargetId && rejectOrder && (
        <RejectionModal
          orderId={rejectTargetId}
          produceName={rejectOrder.produceName}
          onSuccess={(id, farmerNote) => {
            onStatusChange(id, "rejected", farmerNote);
            setRejectTargetId(null);
          }}
          onError={onStatusError}
          onClose={() => setRejectTargetId(null)}
        />
      )}
    </>
  );
}
