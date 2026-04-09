"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminRoute from "@/components/AdminRoute";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  MessageSquareWarning,
  Megaphone,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Agents", href: "/admin/users?tab=agent", icon: UserCheck },
  { label: "Listings", href: "/admin/listings", icon: Package },
  { label: "Complaints", href: "/admin/complaints", icon: MessageSquareWarning },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AdminRoute>
      <div className="flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="w-60 shrink-0 border-r bg-card flex flex-col">
          <div className="px-6 py-5 border-b">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Admin Panel
            </span>
            <p className="mt-0.5 text-lg font-bold text-foreground leading-tight">
              AgriLens
            </p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="px-6 py-4 border-t">
            <p className="text-xs text-muted-foreground">AgriLens Admin v1.0</p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 border-b bg-background px-8 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {navItems.find(
                (n) => pathname === n.href || pathname.startsWith(n.href + "/")
              )?.label ?? "Admin"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Admin
              </span>
              <LogoutButton />
            </div>
          </header>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </AdminRoute>
  );
}
