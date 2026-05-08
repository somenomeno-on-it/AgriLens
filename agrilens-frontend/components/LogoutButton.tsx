"use client";

import { useRouter } from "next/navigation";
import { clearAuthSession } from "@/lib/auth";

type LogoutButtonProps = {
  variant?: "default" | "outline" | "destructive";
  className?: string;
};

export default function LogoutButton({
  variant = "outline",
  className,
}: LogoutButtonProps) {
  const router = useRouter();

  const onLogout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  return (
    <button
      type="button"
      className={`agri-btn-outline ${className || ""}`}
      onClick={onLogout}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Sign Out
    </button>
  );
}
