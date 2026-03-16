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

function getUserId() {
  if (typeof window === "undefined") return "demo-farmer";
  return window.localStorage.getItem("farmerUserId") || "demo-farmer";
}

export async function fetchNotifications(): Promise<Notification[]> {
  const userId = getUserId();
  const res = await fetch(`${API_BASE}/api/notifications`, {
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
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
  const userId = getUserId();
  const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
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
  const userId = getUserId();
  const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to mark all notifications read");
  }

  return res.json();
}

