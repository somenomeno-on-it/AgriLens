"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { getAuthUser, type AuthRole } from "@/lib/auth";
import { LayoutDashboard, Package, ShoppingBag, UserCircle2, Bell, BarChart3, MessageSquareWarning } from "lucide-react";

const HIDE_HEADER_PREFIXES = ["/login", "/signup"];

function shouldHideHeader(pathname: string) {
  return HIDE_HEADER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function ConditionalHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const role: AuthRole | null = getAuthUser()?.role ?? null;
  const isFarmer = role === "farmer";
  const isAgent = role === "agent";
  const isAdmin = role === "admin";
  const isCustomer = role === "customer";
  const shouldUseSidePanel = isFarmer || isCustomer;
  const hidden = shouldHideHeader(pathname);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    if (!hidden && shouldUseSidePanel) {
      document.body.classList.add("agri-with-sidepanel");
    } else {
      document.body.classList.remove("agri-with-sidepanel");
    }
    return () => {
      document.body.classList.remove("agri-with-sidepanel");
    };
  }, [mounted, shouldUseSidePanel, hidden]);

  if (hidden) return null;

  if (!mounted) {
    return (
      <header className="agri-nav">
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: "60px" }}>
          <nav style={{ display: "flex", alignItems: "center", gap: "4px" }} />
          <div style={{ width: "40px" }} aria-hidden />
        </div>
      </header>
    );
  }

  if (isAdmin || isAgent) return null;

  if (shouldUseSidePanel) {
    const navItems = isFarmer
      ? [
          { label: "Dashboard", href: "/farmer", icon: LayoutDashboard, exact: true },
          { label: "My Listings", href: "/produce", icon: Package },
          { label: "Order Inbox", href: "/farmer/orders", icon: ShoppingBag },
          { label: "Analytics", href: "/farmer/analytics", icon: BarChart3 },
          { label: "Complaints", href: "/farmer/complaints", icon: MessageSquareWarning },
          { label: "Notifications", href: "/notifications", icon: Bell },
        ]
      : [
          { label: "My Profile", href: "/customer/profile", icon: UserCircle2 },
          { label: "Marketplace", href: "/customer/marketplace", icon: ShoppingBag },
          { label: "My Orders", href: "/customer/orders", icon: Package },
        ];

    return (
      <>
        {/* Desktop side panel */}
        <aside className="agri-admin-sidebar agri-role-sidepanel hidden md:flex md:flex-col">
          <div className="px-6 py-5 border-b border-white/10">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-100/80">
              {isFarmer ? "Farmer Panel" : "Customer Panel"}
            </span>
            <p className="mt-0.5 text-lg font-bold text-white leading-tight">AgriLens</p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navItems.map(({ label, href, icon: Icon, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={`agri-admin-nav-link ${isActive ? "agri-admin-nav-link-active" : ""}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="px-6 py-4 border-t border-white/10">
            <p className="text-xs text-emerald-100/70">AgriLens {isFarmer ? "Farmer" : "Customer"} v1.0</p>
          </div>
        </aside>

        {/* Mobile top nav fallback */}
        <header className="agri-nav md:hidden">
          <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", minHeight: "60px", gap: "8px" }}>
            <Link href={isFarmer ? "/farmer" : "/customer/profile"} className="agri-nav-brand">
              AgriLens
            </Link>
            <nav style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {navItems.slice(0, 3).map(({ label, href, exact }) => (
                <Link key={href} href={href} className={exact ? (pathname === href ? "agri-nav-link agri-nav-link-active" : "agri-nav-link") : navLinkClass(href)}>
                  {label}
                </Link>
              ))}
              {isFarmer && <NotificationBell />}
            </nav>
          </div>
        </header>
      </>
    );
  }

  function navLinkClass(href: string, exact = false) {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return isActive ? "agri-nav-link agri-nav-link-active" : "agri-nav-link";
  }

  return (
    <header className="agri-nav">
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: "60px",
        }}
      >
        <nav style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
          {isFarmer && (
            <>
              <Link href="/farmer" className="agri-nav-brand" style={{ marginRight: "12px" }}>
                AgriLens
              </Link>
              <Link href="/farmer" className={navLinkClass("/farmer", true)}>
                Dashboard
              </Link>
              <Link href="/produce" className={navLinkClass("/produce")}>
                My Listings
              </Link>
              <Link href="/farmer/orders" className={navLinkClass("/farmer/orders")}>
                Order Inbox
              </Link>
              <Link href="/farmer/analytics" className={navLinkClass("/farmer/analytics")}>
                Analytics
              </Link>
              <Link href="/farmer/complaints" className={navLinkClass("/farmer/complaints")}>
                Complaints
              </Link>
              <Link href="/notifications" className={navLinkClass("/notifications")}>
                Notifications
              </Link>
            </>
          )}

          {isAgent && (
            <>
              <Link href="/agent/dashboard" className="agri-nav-brand" style={{ marginRight: "12px" }}>
                AgriLens
              </Link>
              <Link href="/agent/dashboard" className={navLinkClass("/agent/dashboard", true)}>
                Dashboard
              </Link>
              <Link href="/agent/queue" className={navLinkClass("/agent/queue")}>
                Produce Queue
              </Link>
            </>
          )}

          {isCustomer && (
            <>
              <Link href="/customer/profile" className="agri-nav-brand" style={{ marginRight: "12px" }}>
                AgriLens
              </Link>
              <Link href="/customer/profile" className={navLinkClass("/customer/profile")}>
                My Profile
              </Link>
              <Link href="/customer/marketplace" className={navLinkClass("/customer/marketplace")}>
                Marketplace
              </Link>
              <Link href="/customer/orders" className={navLinkClass("/customer/orders")}>
                My Orders
              </Link>
            </>
          )}

          {!isFarmer && !isAgent && !isAdmin && !isCustomer && (
            <>
              <Link href="/guest/map" className="agri-nav-brand" style={{ marginRight: "12px" }}>
                AgriLens
              </Link>
              <Link href="/guest/map" className={navLinkClass("/guest/map")}>
                Public Map
              </Link>
              <Link href="/login" className={navLinkClass("/login", true)}>
                Login
              </Link>
            </>
          )}
        </nav>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isFarmer ? (
            <NotificationBell />
          ) : (
            <div style={{ width: "40px" }} aria-hidden />
          )}
        </div>
      </div>
    </header>
  );
}
