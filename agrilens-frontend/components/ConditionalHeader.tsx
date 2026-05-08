"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { getAuthUser, type AuthRole } from "@/lib/auth";

const HIDE_HEADER_PREFIXES = ["/login", "/signup"];

function shouldHideHeader(pathname: string) {
  return HIDE_HEADER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function ConditionalHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (shouldHideHeader(pathname)) return null;

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

  const role: AuthRole | null = getAuthUser()?.role ?? null;
  const isFarmer = role === "farmer";
  const isAgent = role === "agent";
  const isAdmin = role === "admin";
  const isCustomer = role === "customer";

  if (isAdmin) return null;

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
