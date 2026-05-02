"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CustomerRoute from "@/components/CustomerRoute";

function CustomerMarketplaceInner() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/marketplace");
  }, [router]);

  return <div className="p-6">Redirecting to marketplace...</div>;
}

export default function CustomerMarketplacePage() {
  return (
    <CustomerRoute>
      <CustomerMarketplaceInner />
    </CustomerRoute>
  );
}
