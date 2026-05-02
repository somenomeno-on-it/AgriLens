"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthHeaders, getAuthUser } from "@/lib/auth";
import type { MarketplaceListing } from "@/components/ListingCard";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type CustomerProfileResponse = {
  phone?: string;
  address?: {
    division?: string;
    district?: string;
    upazila?: string;
    details?: string;
  };
};

function composeAddress(profile: CustomerProfileResponse | null) {
  const address = profile?.address;
  if (!address) return "";
  return [address.details, address.upazila, address.district, address.division]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

export default function OrderForm({ listing }: { listing: MarketplaceListing }) {
  const router = useRouter();
  const authUser = getAuthUser();
  const isCustomer = authUser?.role === "customer";

  const [orderedQty, setOrderedQty] = useState<string>("1");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const maxQty = Number(listing.remainingQty || listing.availableQty || 0);

  useEffect(() => {
    if (!isCustomer) return;

    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/customer/profile`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const data: CustomerProfileResponse = await res.json();
        setPhone(data?.phone || "");
        setAddress(composeAddress(data));
      } catch {
        // Keep form usable even if prefill fails.
      }
    };

    loadProfile();
  }, [isCustomer]);

  const qtyNumber = useMemo(() => Number(orderedQty), [orderedQty]);

  const placeOrder = async () => {
    setError("");
    setSuccess("");

    if (!isCustomer) {
      setError("Please log in as a customer to place an order.");
      return;
    }

    if (!qtyNumber || Number.isNaN(qtyNumber) || qtyNumber <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (qtyNumber > maxQty) {
      setError(`Quantity cannot exceed remaining stock (${maxQty}).`);
      return;
    }

    if (!phone.trim() || !address.trim()) {
      setError("Phone and address are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          listingId: listing.id,
          orderedQty: qtyNumber,
          customerContact: {
            phone: phone.trim(),
            address: address.trim(),
          },
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.message || "Failed to place order.");
        return;
      }

      setSuccess("Order placed successfully.");
      window.setTimeout(() => {
        router.push("/customer/orders");
      }, 900);
    } catch {
      setError("Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Place Order</h3>

      {!isCustomer && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          Please log in as a customer to place an order.
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="orderQty">Quantity ({listing.unit || "unit"})</Label>
        <Input
          id="orderQty"
          type="number"
          min={1}
          max={maxQty}
          value={orderedQty}
          onChange={(e) => setOrderedQty(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Max: {maxQty} {listing.unit || "unit"}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="orderPhone">Phone</Label>
        <Input id="orderPhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="orderAddress">Address</Label>
        <Input id="orderAddress" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-green-600 px-4 py-3 text-sm text-white shadow">
          {success}
        </div>
      )}

      <Button onClick={placeOrder} disabled={!isCustomer || loading} className="w-full">
        {loading ? "Placing Order..." : "Place Order"}
      </Button>
    </Card>
  );
}
