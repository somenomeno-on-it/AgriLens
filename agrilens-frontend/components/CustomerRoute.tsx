"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clearAuthSession, getCurrentUserRole } from "@/lib/auth";

/**
 * CustomerRoute — client-side route guard for JWT auth.
 * Requires an authenticated session with role === "customer".
 * Mirrors the pattern used in AdminRoute.tsx.
 */
export default function CustomerRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  if (typeof window === "undefined") return null; // Prevent hydration mismatch

  const role = getCurrentUserRole();

  if (role !== "customer") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div>
            <h1 className="text-xl font-semibold">Customer access required</h1>
            <p className="text-sm text-muted-foreground mt-2">
              You must log in with a customer account to access this page.
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
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
