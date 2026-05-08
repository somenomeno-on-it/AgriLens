"use client";

import { useEffect, useMemo, useState } from "react";
import { NotificationCard } from "@/components/NotificationCard";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/notifications";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      alert("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkAll = async () => {
    setActionLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      alert("Failed to mark all as read");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkOne = async (n: Notification) => {
    if (n.isRead) return;
    try {
      await markNotificationRead(n._id);
      setNotifications((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
      );
    } catch {
      alert("Failed to mark as read");
    }
  };

  if (loading) {
    return (
      <div className="agri-page">
        <div className="agri-skeleton" style={{ height: "80px", marginBottom: "12px" }} />
        <div className="agri-skeleton" style={{ height: "80px", marginBottom: "12px" }} />
        <div className="agri-skeleton" style={{ height: "80px" }} />
      </div>
    );
  }

  return (
    <div className="agri-page space-y-6" style={{ maxWidth: "800px" }}>
      <div className="agri-page-header flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <h1 className="agri-page-title">Notifications</h1>
          <p className="agri-page-subtitle">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : "You're all caught up!"}
          </p>
        </div>

        <button
          className="agri-btn-outline"
          onClick={handleMarkAll}
          disabled={actionLoading || notifications.length === 0 || unreadCount === 0}
        >
          {actionLoading ? "Marking..." : "Mark All as Read"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {notifications.map((n) => (
          <NotificationCard
            key={n._id}
            notification={n}
            onClick={() => handleMarkOne(n)}
          />
        ))}

        {notifications.length === 0 && (
          <div className="agri-empty">
            <div className="agri-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <h3 className="agri-empty-title">All caught up</h3>
            <p className="agri-empty-text">No notifications to show here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
