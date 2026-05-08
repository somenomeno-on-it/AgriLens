"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CustomerRoute from "@/components/CustomerRoute";

function CustomerMarketplaceInner() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/marketplace");
  }, [router]);

  return (
    <div className="agri-customer-shell">
      <div className="agri-page">
        <div className="agri-empty">
          <div className="agri-empty-title">Redirecting to marketplace...</div>
          <div className="agri-empty-text">Please wait while we prepare fresh listings for you.</div>
        </div>
      </div>
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
