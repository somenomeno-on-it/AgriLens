"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clearAuthSession, getCurrentUserRole } from "@/lib/auth";

/**
 * AdminRoute — client-side route guard for JWT auth.
 * Requires an authenticated session with role === "admin".
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  if (typeof window === "undefined") return null; // Prevent hydration mismatch

  const role = getCurrentUserRole();

  if (role !== "admin") {
    return (
      <div className="agri-admin-shell flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <Card className="agri-card w-full max-w-md p-6 space-y-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--agri-warm-900)]">Admin access required</h1>
            <p className="text-sm text-[var(--agri-warm-500)] mt-2">
              You must log in with an admin account to access this panel.
            </p>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              clearAuthSession();
              router.replace("/login");
            }}
          >
            Go to login
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.replace("/403")}
          >
            View 403 page instead
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
