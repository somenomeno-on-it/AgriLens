"use client";

import type { Notification } from "@/lib/notifications";

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

type Props = {
  notification: Notification;
  onClick?: () => void;
  compact?: boolean;
};

export function NotificationCard({ notification, onClick, compact }: Props) {
  const isUnread = !notification.isRead;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: compact ? "12px 14px" : "16px 20px",
        borderRadius: "14px",
        background: isUnread ? "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)" : "#fff",
        border: `1.5px solid ${isUnread ? "#bbf7d0" : "#f5f5f4"}`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        boxShadow: isUnread ? "0 2px 10px rgba(22,163,74,0.06)" : "none",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = isUnread 
            ? "0 4px 16px rgba(22,163,74,0.12)" 
            : "0 2px 10px rgba(0,0,0,0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = isUnread 
            ? "0 2px 10px rgba(22,163,74,0.06)" 
            : "none";
        }
      }}
    >
      {/* Icon based on notification type / status */}
      <div 
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: compact ? "32px" : "40px",
          height: compact ? "32px" : "40px",
          borderRadius: "50%",
          background: isUnread ? "#dcfce7" : "#f5f5f4",
          flexShrink: 0,
        }}
      >
        <svg 
          width={compact ? "16" : "20"} 
          height={compact ? "16" : "20"} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={isUnread ? "#16a34a" : "#78716c"} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div 
          style={{ 
            fontSize: compact ? "0.85rem" : "0.95rem", 
            fontWeight: isUnread ? 700 : 500,
            color: isUnread ? "#14532d" : "#44403c",
            lineHeight: 1.4,
            marginBottom: "4px"
          }}
        >
          {notification.message}
        </div>
        <div 
          style={{ 
            fontSize: compact ? "0.7rem" : "0.8rem", 
            color: isUnread ? "#16a34a" : "#78716c",
            fontWeight: 500
          }}
        >
          {formatTimestamp(notification.createdAt)}
        </div>
      </div>

      {isUnread && (
        <div 
          style={{ 
            width: "8px", 
            height: "8px", 
            borderRadius: "50%", 
            background: "#16a34a",
            position: "absolute",
            top: "14px",
            right: "14px",
            boxShadow: "0 0 0 3px #dcfce7"
          }} 
        />
      )}
    </div>
  );
}
