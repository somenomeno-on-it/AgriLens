"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
      alert("Failed to mark as read");
    }
  };

  if (loading) {
    return <div className="p-6">Loading notifications...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <div className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleMarkAll}
          disabled={actionLoading || notifications.length === 0 || unreadCount === 0}
        >
          {actionLoading ? "Marking..." : "Mark All as Read"}
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <NotificationCard
            key={n._id}
            notification={n}
            onClick={() => handleMarkOne(n)}
          />
        ))}

        {notifications.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}

