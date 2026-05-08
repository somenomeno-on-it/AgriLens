"use client";

import React from "react";

type StatusHistoryEntry = {
  status: string;
  changedAt: string;
};

type StatusStepperProps = {
  statusHistory: StatusHistoryEntry[];
  currentStatus: string;
};

const MAIN_STEPS = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packaging", label: "Packaging" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export default function StatusStepper({
  statusHistory,
  currentStatus,
}: StatusStepperProps) {
  const reachedStatuses = new Set(statusHistory.map((h) => h.status));
  const isRejected = currentStatus === "rejected";

  const getStepTimestamp = (stepKey: string): string | null => {
    const entry = statusHistory.find((h) => h.status === stepKey);
    if (!entry) return null;
    return new Date(entry.changedAt).toLocaleDateString("en-BD", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Main track */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0,
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {MAIN_STEPS.map((step, idx) => {
          const reached = reachedStatuses.has(step.key);
          const isCurrent = currentStatus === step.key;
          const timestamp = getStepTimestamp(step.key);
          const isLast = idx === MAIN_STEPS.length - 1;

          return (
            <React.Fragment key={step.key}>
              {/* Step node */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "72px",
                  flex: "1 0 72px",
                }}
              >
                {/* Circle */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: isRejected
                      ? "#f1f5f9"
                      : reached
                      ? isCurrent
                        ? "linear-gradient(135deg,#16a34a,#15803d)"
                        : "#22c55e"
                      : "#e2e8f0",
                    border: isCurrent && !isRejected
                      ? "3px solid #15803d"
                      : reached && !isRejected
                      ? "2px solid #16a34a"
                      : "2px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    boxShadow: isCurrent && !isRejected
                      ? "0 0 0 4px rgba(22,163,74,0.15)"
                      : "none",
                    transition: "all 0.2s",
                    flexShrink: 0,
                    opacity: isRejected && step.key !== "pending" ? 0.35 : 1,
                  }}
                  title={step.label}
                >
                  {reached && !isRejected ? (
                    <span style={{ fontSize: "13px", color: "#fff", fontWeight: 700 }}>
                      {isCurrent ? "•" : "✓"}
                    </span>
                  ) : (
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "0.63rem",
                    fontWeight: isCurrent && !isRejected ? 700 : 500,
                    color:
                      isRejected && step.key !== "pending"
                        ? "#cbd5e1"
                        : reached && !isRejected
                        ? "#15803d"
                        : "#64748b",
                    textAlign: "center",
                    lineHeight: 1.2,
                    maxWidth: "70px",
                    wordBreak: "break-word",
                  }}
                >
                  {step.label}
                </div>

                {/* Timestamp */}
                {timestamp && !isRejected && (
                  <div
                    style={{
                      marginTop: "2px",
                      fontSize: "0.58rem",
                      color: "#94a3b8",
                      textAlign: "center",
                    }}
                  >
                    {timestamp}
                  </div>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    flex: "1 1 0",
                    height: "3px",
                    background:
                      isRejected
                        ? "#f1f5f9"
                        : reachedStatuses.has(MAIN_STEPS[idx + 1].key)
                        ? "#22c55e"
                        : "#e2e8f0",
                    marginTop: "16px",
                    borderRadius: "2px",
                    transition: "background 0.3s",
                    minWidth: "12px",
                    opacity: isRejected ? 0.3 : 1,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Rejected terminal state */}
      {isRejected && (
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            borderRadius: "10px",
            background: "linear-gradient(135deg,#fef2f2,#fee2e2)",
            border: "1.5px solid #fca5a5",
          }}
        >
          <span
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "9999px",
              background: "#ef4444",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            !
          </span>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#dc2626" }}>
              Order Rejected
            </div>
            {getStepTimestamp("rejected") && (
              <div style={{ fontSize: "0.68rem", color: "#ef4444" }}>
                {getStepTimestamp("rejected")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
