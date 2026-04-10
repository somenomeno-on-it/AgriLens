"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  const [isMounted, setIsMounted] = useState(false);
  const [role, setRole] = useState<AuthRole | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setRole(getAuthUser()?.role ?? null);
  }, [pathname]);

  if (shouldHideHeader(pathname)) {
    return null;
  }

  // Prevent hydration mismatch by returning a neutral shell
  // that matches the server's initial render structure.
  if (!isMounted) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <nav className="flex flex-wrap items-center gap-4 text-sm" />
          <div className="w-10 shrink-0" aria-hidden />
        </div>
      </header>
    );
  }

  const isFarmer = role === "farmer";
  const isAgent = role === "agent";
  const isAdmin = role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {isFarmer && (
            <>
              <Link className="font-semibold" href="/farmer">
                AgriLens
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/farmer">
                Farmer
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/produce">
                Produce
              </Link>
              <Link
                className="text-muted-foreground hover:text-foreground"
                href="/farmer/analytics"
              >
                Analytics
              </Link>
              <Link
                className="text-muted-foreground hover:text-foreground"
                href="/notifications"
              >
                Notifications
              </Link>
            </>
          )}

          {isAgent && (
            <>
              <Link className="font-semibold" href="/agent/dashboard">
                AgriLens
              </Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/agent/queue">
                Agent Queue
              </Link>
              <Link
                className="text-muted-foreground hover:text-foreground"
                href="/agent/dashboard"
              >
                Agent Dashboard
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link className="font-semibold" href="/admin/dashboard">
                AgriLens
              </Link>
              <Link
                className="text-muted-foreground hover:text-foreground"
                href="/admin/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="text-muted-foreground hover:text-foreground"
                href="/admin/users"
              >
                Users
              </Link>
            </>
          )}

          {!isFarmer && !isAgent && !isAdmin && (
            <Link className="font-semibold" href="/login">
              AgriLens
            </Link>
          )}
        </nav>
        {isFarmer ? <NotificationBell /> : <div className="w-10 shrink-0" aria-hidden />}
      </div>
    </header>
  );
}
