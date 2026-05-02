"use client";

import CustomerRoute from "@/components/CustomerRoute";

function CustomerMarketplaceInner() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Marketplace</h1>
      <p className="text-sm text-muted-foreground mt-2">Coming soon.</p>
    </div>
  );
}

export default function CustomerMarketplacePage() {
  return (
    <CustomerRoute>
      <CustomerMarketplaceInner />
    </CustomerRoute>
  );
}
