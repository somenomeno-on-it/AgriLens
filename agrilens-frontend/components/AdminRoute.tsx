"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * AdminRoute — client-side route guard for mock auth.
 * Requires localStorage `userRole` === "admin" (and `userId` for API headers).
 * If missing, shows a short gate with a one-click demo instead of a silent redirect.
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    const role =
      typeof window !== "undefined"
        ? window.localStorage.getItem("userRole")
        : null;

    if (role === "admin") {
      setState("allowed");
      return;
    }

    const bypass =
      process.env.NEXT_PUBLIC_ADMIN_BYPASS === "true" ||
      process.env.NEXT_PUBLIC_ALLOW_ADMIN_DEV === "true";
    if (bypass) {
      window.localStorage.setItem("userRole", "admin");
      if (!window.localStorage.getItem("userId")) {
        window.localStorage.setItem("userId", "admin-user");
      }
      setState("allowed");
      return;
    }

    setState("denied");
  }, [router]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6 text-muted-foreground text-sm">
        Checking admin access…
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div>
            <h1 className="text-xl font-semibold">Admin access required</h1>
            <p className="text-sm text-muted-foreground mt-2">
              This panel uses mock auth: your browser must have{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">userRole</code> set to{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">admin</code> in Local
              Storage (the login page does not set this yet).
            </p>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Manual:</strong> DevTools (F12) → Application →
              Local Storage → your origin → add{" "}
              <code className="rounded bg-muted px-1">userRole</code> ={" "}
              <code className="rounded bg-muted px-1">admin</code> and{" "}
              <code className="rounded bg-muted px-1">userId</code> ={" "}
              <code className="rounded bg-muted px-1">admin-user</code>, then reload.
            </p>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              window.localStorage.setItem("userRole", "admin");
              window.localStorage.setItem("userId", "admin-user");
              window.location.reload();
            }}
          >
            Continue as demo admin
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
