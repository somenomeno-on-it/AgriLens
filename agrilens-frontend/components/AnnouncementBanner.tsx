"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type Announcement = {
  _id: string;
  title: string;
  body: string;
  targetAudience: string;
  createdAt: string;
};

type Props = {
  role: "farmer" | "agent";
  district?: string;
  upazila?: string;
};

const DISMISSED_KEY = "dismissed_announcements";

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

export default function AnnouncementBanner({ role, district = "", upazila = "" }: Props) {
  const [visible, setVisible] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const params = new URLSearchParams({ role });
        if (district) params.set("district", district.toLowerCase());
        if (upazila) params.set("upazila", upazila.toLowerCase());

        const res = await fetch(`${API_BASE}/api/announcements?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data: Announcement[] = await res.json();
        const dismissed = getDismissed();
        setVisible(data.filter((a) => !dismissed.has(a._id)));
      } catch {
        // silently ignore
      }
    };

    fetchAnnouncements();
  }, [role, district, upazila]);

  const dismiss = (id: string) => {
    const dismissed = getDismissed();
    dismissed.add(id);
    saveDismissed(dismissed);
    setVisible((prev) => prev.filter((a) => a._id !== id));
  };

  if (visible.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }} role="region" aria-label="Platform announcements">
      {visible.map((ann) => (
        <div
          key={ann._id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            padding: "16px 20px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border: "1.5px solid #fde68a",
            boxShadow: "0 4px 16px rgba(245, 158, 11, 0.08)",
          }}
        >
          {/* Megaphone icon */}
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#fef3c7",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m3 11 18-5v12L3 14v-3z" />
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#92400e", margin: "0 0 4px 0" }}>
              {ann.title}
            </p>
            <p style={{ fontSize: "0.85rem", color: "#b45309", lineHeight: 1.5, margin: 0 }}>
              {ann.body}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 600, marginTop: "8px", margin: "8px 0 0 0" }}>
              {new Date(ann.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={() => dismiss(ann._id)}
            title="Dismiss announcement"
            aria-label="Dismiss announcement"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.2s ease",
              marginTop: "-4px",
              marginRight: "-4px"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fde68a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
