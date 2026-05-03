"use client";

import StatusStepper from "@/components/StatusStepper";

type StatusHistoryEntry = {
  status: string;
  changedAt: string;
};

export type CustomerOrder = {
  _id: string;
  produceName: string;
  orderedQty: number;
  unit: string;
  priceAtOrder: number;
  farmName: string;
  district: string;
  status: string;
  statusHistory: StatusHistoryEntry[];
  farmerNote?: string;
  createdAt: string;
};

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:          { label: "Pending",         bg: "#fef9c3", color: "#a16207" },
  confirmed:        { label: "Confirmed",       bg: "#dcfce7", color: "#15803d" },
  packaging:        { label: "Packaging",       bg: "#dbeafe", color: "#1d4ed8" },
  out_for_delivery: { label: "Out for Delivery",bg: "#ede9fe", color: "#6d28d9" },
  delivered:        { label: "Delivered",       bg: "#d1fae5", color: "#065f46" },
  rejected:         { label: "Rejected",        bg: "#fee2e2", color: "#dc2626" },
};

export default function OrderStatusCard({ order }: { order: CustomerOrder }) {
  const badge = STATUS_BADGE[order.status] ?? { label: order.status, bg: "#f1f5f9", color: "#475569" };
  const totalPrice = (order.priceAtOrder * order.orderedQty).toLocaleString("en-BD");
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        borderRadius: "16px",
        background: "#ffffff",
        border: "1.5px solid #e2e8f0",
        padding: "20px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
        (e.currentTarget as HTMLDivElement).style.transform = "";
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
            🌾 {order.produceName}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
            {order.farmName ? `${order.farmName}` : ""}
            {order.district ? ` · ${order.district}` : ""}
          </div>
        </div>

        {/* Status badge */}
        <span
          style={{
            padding: "4px 12px",
            borderRadius: "9999px",
            background: badge.bg,
            color: badge.color,
            fontSize: "0.73rem",
            fontWeight: 700,
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}
        >
          {badge.label}
        </span>
      </div>

      {/* Details row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))",
          gap: "8px",
          marginTop: "14px",
          padding: "12px",
          borderRadius: "10px",
          background: "#f8fafc",
        }}
      >
        <div>
          <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Quantity</div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>
            {order.orderedQty} {order.unit}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Price / Unit</div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>
            ৳{order.priceAtOrder.toLocaleString("en-BD")}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Total Paid</div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#16a34a" }}>
            ৳{totalPrice}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Order Date</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
            {orderDate}
          </div>
        </div>
      </div>

      {/* Status stepper */}
      <div style={{ marginTop: "18px" }}>
        <StatusStepper
          statusHistory={order.statusHistory}
          currentStatus={order.status}
        />
      </div>

      {/* Farmer note — only shown when rejected */}
      {order.status === "rejected" && order.farmerNote && (
        <div
          style={{
            marginTop: "14px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "linear-gradient(135deg,#fef2f2,#fee2e2)",
            border: "1.5px solid #fca5a5",
          }}
        >
          <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#dc2626", marginBottom: "4px" }}>
            📝 Farmer&apos;s Note
          </div>
          <div style={{ fontSize: "0.82rem", color: "#b91c1c", lineHeight: 1.5 }}>
            {order.farmerNote}
          </div>
        </div>
      )}
    </div>
  );
}
