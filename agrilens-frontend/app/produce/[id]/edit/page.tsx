"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAuthHeaders } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type Farm = {
  _id: string;
  name: string;
};

export default function EditProducePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

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

  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [farmsRes, listingRes] = await Promise.all([
          fetch(`${API_BASE}/api/farmer/farms`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/api/produce/${id}`, { headers: getAuthHeaders() }),
        ]);

        if (farmsRes.ok) {
          const farmsData = await farmsRes.json();
          setFarms(farmsData);
        }

        if (listingRes.ok) {
          const listing = await listingRes.json();
          setForm({
            farmId: listing.farmId?._id || "",
            cropType: listing.cropType || "",
            description: listing.description || "",
            expectedHarvestDate: listing.expectedHarvestDate ? listing.expectedHarvestDate.slice(0, 10) : "",
            availabilityStart: listing.availabilityStart ? listing.availabilityStart.slice(0, 10) : "",
            availabilityEnd: listing.availabilityEnd ? listing.availabilityEnd.slice(0, 10) : "",
            quantity: String(listing.quantity ?? ""),
            unit: listing.unit || "kg",
            pricePerUnit: String(listing.pricePerUnit ?? ""),
          });
        } else {
          alert("Failed to load listing");
          router.push("/produce");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load data");
        router.push("/produce");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, router]);

  const uploadPhotos = async (listingId: string) => {
    if (!photoFiles || photoFiles.length === 0) return;
    setPhotoUploading(true);
    setPhotoError(null);

    const formData = new FormData();
    Array.from(photoFiles).forEach((file) => { formData.append("photos", file); });

    const res = await fetch(`${API_BASE}/api/produce/${listingId}/photos`, {
      method: "POST",
      headers: (() => {
        const headers = getAuthHeaders() as Record<string, string>;
        const { ["Content-Type"]: _contentType, ...rest } = headers;
        return rest;
      })(),
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      setPhotoError(errText || "Failed to upload photos. Check file type and size.");
    }
    setPhotoUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/produce/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
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
      alert(`Failed to update listing: ${errText}`);
      return;
    }

    if (id) {
      await uploadPhotos(id);
    }
    router.push("/produce");
  };

  if (loading) {
    return (
      <div className="agri-page" style={{ maxWidth: "700px" }}>
        <div className="agri-skeleton" style={{ height: "400px" }} />
      </div>
    );
  }

  const handleNumericChange = (field: "quantity" | "pricePerUnit", value: string) => {
    if (value === "") {
      setForm((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
    const num = Number(normalized);
    if (Number.isNaN(num) || num < 0) return;
    setForm((prev) => ({ ...prev, [field]: normalized }));
  };

  return (
    <div className="agri-page" style={{ maxWidth: "700px" }}>
      <div className="agri-page-header">
        <h1 className="agri-page-title">Edit Produce Listing</h1>
        <p className="agri-page-subtitle">Update information or add new photos for your crop</p>
      </div>

      <div className="agri-section">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="agri-field">
            <label className="agri-label">Farm Origin</label>
            <select
              className="agri-select"
              value={form.farmId}
              onChange={(e) => setForm((prev) => ({ ...prev, farmId: e.target.value }))}
            >
              <option value="">Select a farm (optional)</option>
              {farms.map((farm) => (
                <option key={farm._id} value={farm._id}>{farm.name}</option>
              ))}
            </select>
          </div>

          <div className="agri-field">
            <label className="agri-label">Crop Type</label>
            <input
              style={{ height: "44px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 14px", width: "100%", outline: "none" }}
              value={form.cropType}
              onChange={(e) => setForm((prev) => ({ ...prev, cropType: e.target.value }))}
              required
              placeholder="e.g. Boro Rice, Potatoes"
            />
          </div>

          <div className="agri-field">
            <label className="agri-label">Description</label>
            <textarea
              style={{ borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "12px 14px", minHeight: "100px", resize: "vertical", width: "100%", outline: "none" }}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the quality and variety..."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div className="agri-field">
              <label className="agri-label">Expected Harvest Date</label>
              <input
                type="date"
                style={{ height: "44px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 14px", width: "100%", outline: "none" }}
                value={form.expectedHarvestDate}
                onChange={(e) => setForm((prev) => ({ ...prev, expectedHarvestDate: e.target.value }))}
              />
            </div>
            <div className="agri-field">
              <label className="agri-label">Availability Start</label>
              <input
                type="date"
                style={{ height: "44px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 14px", width: "100%", outline: "none" }}
                value={form.availabilityStart}
                onChange={(e) => setForm((prev) => ({ ...prev, availabilityStart: e.target.value }))}
              />
            </div>
            <div className="agri-field">
              <label className="agri-label">Availability End</label>
              <input
                type="date"
                style={{ height: "44px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 14px", width: "100%", outline: "none" }}
                value={form.availabilityEnd}
                onChange={(e) => setForm((prev) => ({ ...prev, availabilityEnd: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", background: "#f0fdf4", padding: "20px", borderRadius: "12px", border: "1.5px solid #dcfce7" }}>
            <div className="agri-field">
              <label className="agri-label">Quantity</label>
              <input
                type="text"
                style={{ height: "44px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 14px", width: "100%", outline: "none" }}
                value={form.quantity}
                onChange={(e) => handleNumericChange("quantity", e.target.value)}
                required
                placeholder="0.00"
              />
            </div>
            <div className="agri-field">
              <label className="agri-label">Unit</label>
              <select
                className="agri-select"
                value={form.unit}
                onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
              >
                <option value="kg">kg</option>
                <option value="ton">ton</option>
                <option value="quintal">quintal</option>
              </select>
            </div>
            <div className="agri-field">
              <label className="agri-label">Price per unit (BDT)</label>
              <input
                type="text"
                style={{ height: "44px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 14px", width: "100%", outline: "none" }}
                value={form.pricePerUnit}
                onChange={(e) => handleNumericChange("pricePerUnit", e.target.value)}
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="agri-field">
            <label className="agri-label">Add / replace photos (up to 5)</label>
            <div style={{ position: "relative" }}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setPhotoFiles(e.target.files)}
                style={{ width: "100%", padding: "10px", background: "#fafaf9", border: "1.5px dashed #bbf7d0", borderRadius: "10px", cursor: "pointer", color: "#44403c" }}
              />
            </div>
            {photoError && <p style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "4px" }}>{photoError}</p>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "12px", borderTop: "1px solid #f5f5f4" }}>
            <button type="button" className="agri-btn-outline" onClick={() => router.push("/produce")} disabled={photoUploading}>
              Cancel
            </button>
            <button type="submit" className="agri-btn-primary" disabled={photoUploading}>
              {photoUploading ? "Updating & uploading photos..." : "Update Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
