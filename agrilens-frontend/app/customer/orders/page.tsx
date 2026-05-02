"use client";

import Link from "next/link";
import CustomerRoute from "@/components/CustomerRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function CustomerOrdersInner() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">My Orders</h1>
      <Card className="space-y-3 p-5">
        <p className="text-sm text-muted-foreground">
          Order history UI is not implemented yet, but your order has been placed.
        </p>
        <Button asChild>
          <Link href="/marketplace">Back to Marketplace</Link>
        </Button>
      </Card>
    </div>
  );
}

export default function CustomerOrdersPage() {
  return (
    <CustomerRoute>
      <CustomerOrdersInner />
    </CustomerRoute>
  );
}
