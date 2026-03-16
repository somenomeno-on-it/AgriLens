"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    } catch (e) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch when the app loads so unread count is available.
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fetch again when dropdown opens to ensure it's fresh.
    if (open) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
      } catch (e) {
        // keep UI responsive; ignore failure for now
      }
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        Notifications
        {unreadCount > 0 && (
          <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] rounded-xl border bg-background p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Recent notifications</div>
            <Link className="text-xs underline" href="/notifications">
              View all
            </Link>
          </div>

          <div className="mt-3 space-y-2">
            {loading && (
              <div className="text-xs text-muted-foreground">Loading...</div>
            )}
            {error && <div className="text-xs text-red-600">{error}</div>}

            {!loading && !error && recent.length === 0 && (
              <div className="text-xs text-muted-foreground">
                No notifications yet.
              </div>
            )}

            {!loading &&
              !error &&
              recent.map((n) => (
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

