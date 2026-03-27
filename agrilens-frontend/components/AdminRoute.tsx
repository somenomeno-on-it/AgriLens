"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * AdminRoute — client-side route guard.
 * Reads localStorage for userRole (set when admin logs in as "userId" + "userRole").
 * Redirects to /403 if the stored role is not 'admin'.
 * Consistent with how the rest of the app handles auth (localStorage headers).
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const role = typeof window !== "undefined"
      ? window.localStorage.getItem("userRole")
      : null;

    if (role !== "admin") {
      router.replace("/403");
    }
  }, [router]);

  return <>{children}</>;
}
