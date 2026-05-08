"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { NotificationCard } from "@/components/NotificationCard";
import {
  fetchNotifications,
  markNotificationRead,
  type Notification,
} from "@/lib/notifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (open) load(); }, [open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const recent = notifications.slice(0, 10);

  const handleClickNotification = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await markNotificationRead(n._id);
        setNotifications((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
        );
      } catch {
        // keep UI responsive
      }
    }
  };

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 14px",
          borderRadius: "10px",
          background: open ? "#f0fdf4" : "#fff",
          border: `1.5px solid ${open ? "#86efac" : "#dcfce7"}`,
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          color: "#15803d",
          transition: "all 0.15s ease",
          position: "relative",
        }}
      >
        {/* Bell SVG */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "20px",
              height: "20px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 800,
              padding: "0 5px",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="agri-notif-panel"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            width: "370px",
            maxWidth: "92vw",
            zIndex: 100,
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px 12px",
              borderBottom: "1px solid #f0fdf4",
              background: "linear-gradient(135deg, #f0fdf4 0%, #fff 100%)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#14532d" }}>Notifications</div>
              {unreadCount > 0 && (
                <div style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 500, marginTop: "1px" }}>
                  {unreadCount} unread
                </div>
              )}
            </div>
            <Link
              href="/notifications"
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#16a34a",
                textDecoration: "none",
                padding: "4px 10px",
                borderRadius: "7px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
              }}
            >
              View all
            </Link>
          </div>

          {/* Notifications list */}
          <div style={{ padding: "8px", maxHeight: "380px", overflowY: "auto" }}>
            {loading && (
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="agri-skeleton" style={{ height: "52px" }} />
                ))}
              </div>
            )}

            {error && (
              <div style={{ padding: "14px 16px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "0.82rem", margin: "8px" }}>
                {error}
              </div>
            )}

            {!loading && !error && recent.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#44403c" }}>All caught up</div>
                <div style={{ fontSize: "0.75rem", color: "#78716c", marginTop: "2px" }}>No new notifications</div>
              </div>
            )}

            {!loading && !error && recent.map((n) => (
              <NotificationCard
                key={n._id}
                notification={n}
                compact
                onClick={() => handleClickNotification(n)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
