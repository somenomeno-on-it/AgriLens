"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type Farm = {
  _id: string;
  name: string;
};

export default function AddProducePage() {
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    farmId: "",
    cropType: "",
    description: "",
    expectedHarvestDate: "",
    availabilityStart: "",
    availabilityEnd: "",
    quantity: "",
    unit: "kg",
    pricePerUnit: "",
  });

  const userId =
    typeof window !== "undefined"
      ? window.localStorage.getItem("farmerUserId") || "demo-farmer"
      : "demo-farmer";

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/farmer/farms`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setFarms(data);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load farms");
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE}/api/produce`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({
        farmId: form.farmId || undefined,
        cropType: form.cropType,
        description: form.description,
        expectedHarvestDate: form.expectedHarvestDate || undefined,
        availabilityStart: form.availabilityStart || undefined,
        availabilityEnd: form.availabilityEnd || undefined,
        quantity: Number(form.quantity),
        unit: form.unit,
        pricePerUnit: Number(form.pricePerUnit),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      alert(`Failed to create listing: ${errText}`);
      return;
    }

    router.push("/produce");
  };

  if (loading) {
    return <div className="p-6">Loading farms...</div>;
  }

  const handleNumericChange = (field: "quantity" | "pricePerUnit", value: string) => {
    // Allow empty string so user can clear the field
    if (value === "") {
      setForm((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    // Only allow digits and a single decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const normalized =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;

    // Prevent negative numbers
    const num = Number(normalized);
    if (Number.isNaN(num) || num < 0) {
      return;
    }

    setForm((prev) => ({ ...prev, [field]: normalized }));
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold mb-2">Add Produce Listing</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Farm</label>
            <select
              className="border rounded px-3 py-2 w-full text-sm"
              value={form.farmId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, farmId: e.target.value }))
              }
            >
              <option value="">Select a farm (optional)</option>
              {farms.map((farm) => (
                <option key={farm._id} value={farm._id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Crop Type</label>
            <Input
              value={form.cropType}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, cropType: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Expected Harvest Date</label>
              <Input
                type="date"
                value={form.expectedHarvestDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    expectedHarvestDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Availability Start</label>
              <Input
                type="date"
                value={form.availabilityStart}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    availabilityStart: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Availability End</label>
              <Input
                type="date"
                value={form.availabilityEnd}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    availabilityEnd: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="text"
                value={form.quantity}
                onChange={(e) => handleNumericChange("quantity", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Unit</label>
              <select
                className="border rounded px-3 py-2 w-full text-sm"
                value={form.unit}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, unit: e.target.value }))
                }
              >
                <option value="kg">kg</option>
                <option value="ton">ton</option>
                <option value="quintal">quintal</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Price per unit</label>
              <Input
                type="text"
                value={form.pricePerUnit}
                onChange={(e) =>
                  handleNumericChange("pricePerUnit", e.target.value)
                }
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/produce")}
            >
              Cancel
            </Button>
            <Button type="submit">Save Listing</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


