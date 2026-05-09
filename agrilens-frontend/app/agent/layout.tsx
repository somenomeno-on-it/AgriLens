"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  MapPin
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { useEffect, useState } from "react";
import { getAssignedRegions, getAuthUser } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", href: "/agent/dashboard", icon: LayoutDashboard },
  { label: "Pending Queue", href: "/agent/queue", icon: ClipboardList },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [regions, setRegions] = useState<any[]>([]);

  useEffect(() => {
    try {
      const res = getAssignedRegions();
      if (Array.isArray(res)) setRegions(res);
      
      const role = getAuthUser()?.role;
      if (role !== "agent" && role !== "admin") {
        window.location.href = "/login";
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="agri-admin-shell flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="agri-admin-sidebar w-64 shrink-0 flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-100/80">
            Agent Portal
          </span>
          <p className="mt-0.5 text-lg font-bold text-white leading-tight">
            AgriLens
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
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

        <div className="px-6 py-4 border-t border-white/10 space-y-2">
          {regions.length > 0 && (
            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100/60">
                Assigned Regions
              </span>
              {regions.map((r, i) => (
                <div key={i} className="text-xs text-emerald-100 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  <span className="capitalize">{r.upazila}, {r.district}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-emerald-100/70">AgriLens Agent v1.0</p>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="agri-admin-topbar px-8 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {navItems.find((n) => pathname.startsWith(n.href))?.label ?? "Agent Panel"}
          </h2>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
              Field Agent
            </span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-8">
          <div className="agri-admin-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
