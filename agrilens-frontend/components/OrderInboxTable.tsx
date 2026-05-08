"use client";

import { useState } from "react";
import StatusDropdown from "@/components/StatusDropdown";
import RejectionModal from "@/components/RejectionModal";

const STATUS_BADGE: Record<string, string> = {
  pending: "agri-badge-pending",
  confirmed: "agri-badge-confirmed",
  packaging: "agri-badge-packaging",
  out_for_delivery: "agri-badge-delivery",
  delivered: "agri-badge-delivered",
  rejected: "agri-badge-rejected",
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
      <div className="agri-empty">
        <div className="agri-empty-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
        </div>
        <div className="agri-empty-title">No orders found</div>
        <div className="agri-empty-text">Orders from customers will appear here once placed.</div>
      </div>
    );
  }

  return (
    <>
      <div className="agri-table-wrapper">
        <table className="agri-table">
          <thead>
            <tr>
              {["Customer", "Produce", "Qty", "Phone", "Delivery Address", "Order Date", "Status", "Action"].map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const badgeClass = STATUS_BADGE[order.status] || "agri-badge-info";
              const label = order.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
              
              const orderDate = new Date(order.createdAt).toLocaleDateString("en-BD", {
                month: "short", day: "numeric", year: "numeric",
              });

              return (
                <tr key={order._id}>
                  <td style={{ fontWeight: 600, color: "#1c1917" }}>{order.customerName}</td>
                  <td style={{ fontWeight: 700, color: "#14532d" }}>{order.produceName}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{order.orderedQty} {order.unit}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{order.customerPhone}</td>
                  <td style={{ maxWidth: "200px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={order.deliveryAddress}>
                      {order.deliveryAddress}
                    </div>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{orderDate}</td>
                  <td>
                    <span className={`agri-badge ${badgeClass}`}>{label}</span>
                    {order.farmerNote && order.status === "rejected" && (
                      <div style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "6px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={order.farmerNote}>
                        Note: {order.farmerNote}
                      </div>
                    )}
                  </td>
                  <td>
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
