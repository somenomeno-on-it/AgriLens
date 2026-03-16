"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/notifications";

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

type Props = {
  notification: Notification;
  onClick?: () => void;
  compact?: boolean;
};

export function NotificationCard({ notification, onClick, compact }: Props) {
  const isUnread = !notification.isRead;

  return (
    <Card
      size={compact ? "sm" : "default"}
      className={cn(
        "px-4 py-3 gap-1 cursor-pointer",
        isUnread ? "bg-muted/60" : "bg-card",
        compact ? "text-xs" : "text-sm"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={cn("leading-snug", isUnread && "font-semibold")}>
        {notification.message}
      </div>
      <div className="text-xs text-muted-foreground">
        {formatTimestamp(notification.createdAt)}
      </div>
    </Card>
  );
}

