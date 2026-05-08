"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminRoute from "@/components/AdminRoute";
import {
  LayoutDashboard,
  Users,
  Package,
  MessageSquareWarning,
  Megaphone,
  MapPin,
  BarChart3,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },

  { label: "Agent regions", href: "/admin/agents/assign", icon: MapPin },
  { label: "Agent performance", href: "/admin/agents/performance", icon: BarChart3 },
  { label: "Listings", href: "/admin/listings", icon: Package },
  { label: "Complaints", href: "/admin/complaints", icon: MessageSquareWarning },
  { label: "Flagged queue", href: "/admin/moderation", icon: Package },
  { label: "Mod log", href: "/admin/moderation/log", icon: Package },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AdminRoute>
      <div className="agri-admin-shell flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="agri-admin-sidebar w-64 shrink-0 flex flex-col">
          <div className="px-6 py-5 border-b border-white/10">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-100/80">
              Admin Panel
            </span>
            <p className="mt-0.5 text-lg font-bold text-white leading-tight">
              AgriLens
            </p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`agri-admin-nav-link ${isActive ? "agri-admin-nav-link-active" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="px-6 py-4 border-t border-white/10">
            <p className="text-xs text-emerald-100/70">AgriLens Admin v1.0</p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="agri-admin-topbar px-8 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {navItems.find((n) => pathname === n.href)?.label ?? "Admin"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Admin
              </span>
              <LogoutButton />
            </div>
          </header>
          <main className="flex-1 p-8">
            <div className="agri-admin-page">{children}</div>
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}
