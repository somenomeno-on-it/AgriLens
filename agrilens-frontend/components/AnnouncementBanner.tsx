"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

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
        // silently ignore — banner is best-effort
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
    <div className="space-y-2" role="region" aria-label="Platform announcements">
      {visible.map((ann) => (
        <div
          key={ann._id}
          className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <Megaphone className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{ann.title}</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">{ann.body}</p>
            <p className="mt-1 text-xs text-amber-600">
              {new Date(ann.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={() => dismiss(ann._id)}
            title="Dismiss"
            className="shrink-0 p-1 rounded hover:bg-amber-200 transition-colors"
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4 text-amber-600" />
          </button>
        </div>
      ))}
    </div>
  );
}
