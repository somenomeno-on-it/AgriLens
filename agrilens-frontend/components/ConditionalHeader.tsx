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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (shouldHideHeader(pathname)) {
    return null;
  }

  // Prevent hydration mismatch by returning a neutral shell until mounted.
  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <nav className="flex flex-wrap items-center gap-4 text-sm" />
          <div className="w-10 shrink-0" aria-hidden />
        </div>
      </header>
    );
  }

  const role: AuthRole | null = getAuthUser()?.role ?? null;
  const isFarmer = role === "farmer";
  const isAgent = role === "agent";
  const isAdmin = role === "admin";
  const isCustomer = role === "customer";

  // Returns className for a nav link: bold + full colour if active, muted otherwise.
  function navClass(href: string, exact = false) {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return isActive
      ? "font-bold text-foreground"
      : "text-muted-foreground hover:text-foreground";
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {isFarmer && (
            <>
              <Link className="font-semibold" href="/farmer">
                AgriLens
              </Link>
              <Link className={navClass("/farmer", true)} href="/farmer">
                Farmer
              </Link>
              <Link className={navClass("/produce")} href="/produce">
                Produce
              </Link>
              <Link className={navClass("/farmer/analytics")} href="/farmer/analytics">
                Analytics
              </Link>
              <Link className={navClass("/notifications")} href="/notifications">
                Notifications
              </Link>
            </>
          )}

          {isAgent && (
            <>
              <Link className="font-semibold" href="/agent/dashboard">
                AgriLens
              </Link>
              <Link className={navClass("/agent/queue")} href="/agent/queue">
                Agent Queue
              </Link>
              <Link className={navClass("/agent/dashboard", true)} href="/agent/dashboard">
                Agent Dashboard
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link className="font-semibold" href="/admin/dashboard">
                AgriLens
              </Link>
              <Link className={navClass("/admin/dashboard", true)} href="/admin/dashboard">
                Dashboard
              </Link>
              <Link className={navClass("/admin/users")} href="/admin/users">
                Users
              </Link>
            </>
          )}

          {isCustomer && (
            <>
              <Link className="font-semibold" href="/customer/profile">
                AgriLens
              </Link>
              <Link className={navClass("/customer/profile")} href="/customer/profile">
                My Profile
              </Link>
              <Link className={navClass("/customer/marketplace")} href="/customer/marketplace">
                Marketplace
              </Link>
            </>
          )}

          {!isFarmer && !isAgent && !isAdmin && !isCustomer && (
            <>
              <Link className="font-semibold" href="/guest/map">
                AgriLens
              </Link>
              <Link className={navClass("/guest/map")} href="/guest/map">
                Public Map
              </Link>
              <Link className={navClass("/login", true)} href="/login">
                Login
              </Link>
            </>
          )}
        </nav>
        {isFarmer ? <NotificationBell /> : <div className="w-10 shrink-0" aria-hidden />}
      </div>
    </header>
  );
}
