import { getAuthHeaders } from "@/lib/auth";

export type NotificationType = "LISTING_STATUS_UPDATE" | string;

export type Notification = {
  _id: string;
  userId: string;
  type: NotificationType;
  message: string;
  listingId?: string;
  isRead: boolean;
  createdAt: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch(`${API_BASE}/api/notifications`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return res.json();
}

export async function markNotificationRead(
  id: string
): Promise<Notification> {
  const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to mark notification read");
  }

  return res.json();
}

export async function markAllNotificationsRead(): Promise<{
  message: string;
  matchedCount?: number;
  modifiedCount?: number;
}> {
  const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to mark all notifications read");
  }

  return res.json();
}

