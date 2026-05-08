"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import CustomerRoute from "@/components/CustomerRoute";
import {
  getDistrictOptions,
  getUpazilaOptionsForDistrict,
} from "@/src/data/bdRegions";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type CustomerAddress = {
  division: string;
  district: string;
  upazila: string;
  details: string;
};

type CustomerProfile = {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: CustomerAddress;
};

const selectClass = "agri-select disabled:opacity-50 disabled:cursor-not-allowed";

function CustomerProfileInner() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    division: "",
    district: "",
    upazila: "",
    details: "",
  });

  // Cascading dropdown data
  const districtOptions = useMemo(() => getDistrictOptions(), []);
  const upazilaOptions = useMemo(
    () => getUpazilaOptionsForDistrict(form.district),
    [form.district]
  );

  // Clear upazila whenever district changes
  const handleDistrictChange = (value: string) => {
    setForm((prev) => ({ ...prev, district: value, upazila: "" }));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/customer/profile`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data: CustomerProfile = await res.json();
          setProfile(data);
          setForm({
            name: data.name || "",
            phone: data.phone || "",
            division: data.address?.division || "",
            district: data.address?.district || "",
            upazila: data.address?.upazila || "",
            details: data.address?.details || "",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/customer/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: {
            division: form.division,
            district: form.district,
            upazila: form.upazila,
            details: form.details,
          },
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.message || "Failed to save profile");
        return;
      }

      const updated: CustomerProfile = await res.json();
      setProfile(updated);
      setSuccess("Profile saved successfully.");
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="agri-customer-shell">
        <div className="agri-page">
          <div className="agri-skeleton" style={{ height: "120px", marginBottom: "16px" }} />
          <div className="agri-skeleton" style={{ height: "360px" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="agri-customer-shell">
      <div className="agri-page space-y-6">
      <div className="agri-hero flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="agri-page-title">My Profile</h1>
          <p className="agri-page-subtitle">Manage your personal details and delivery preferences.</p>
        </div>
        <LogoutButton />
      </div>

      {profile?.email && (
        <p className="text-sm text-[var(--agri-warm-500)]">
          Signed in as <span className="font-medium">{profile.email}</span>
        </p>
      )}

      <section className="agri-section space-y-4">
        <h2 className="agri-section-title">Personal Information</h2>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="agri-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              className="agri-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          <div className="grid gap-2">
            <label className="agri-label" htmlFor="phone">Phone</label>
            <input
              id="phone"
              className="agri-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Your phone number"
            />
          </div>
        </div>
      </section>

      <section className="agri-section space-y-4">
        <h2 className="agri-section-title">Address</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Division — free text */}
          <div className="grid gap-2">
            <label className="agri-label" htmlFor="division">Division</label>
            <input
              id="division"
              className="agri-input"
              value={form.division}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
              placeholder="e.g. Dhaka"
            />
          </div>

          {/* District — dropdown */}
          <div className="flex flex-col gap-1">
            <label className="agri-label">District</label>
            <select
              className={selectClass}
              value={form.district}
              onChange={(e) => handleDistrictChange(e.target.value)}
            >
              <option value="">Choose district</option>
              {districtOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Upazila — dropdown, disabled until district picked */}
          <div className="flex flex-col gap-1">
            <label className="agri-label">Upazila</label>
            <select
              className={selectClass}
              value={form.upazila}
              onChange={(e) => setForm({ ...form, upazila: e.target.value })}
              disabled={!form.district}
            >
              <option value="">Choose upazila</option>
              {upazilaOptions.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* Street / details — free text */}
          <div className="grid gap-2">
            <label className="agri-label" htmlFor="details">Street / Details</label>
            <input
              id="details"
              className="agri-input"
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              placeholder="Street address, house no., etc."
            />
          </div>
        </div>
      </section>

      {error && <p className="agri-alert agri-alert-error">{error}</p>}
      {success && <p className="agri-alert agri-alert-success">{success}</p>}

      <button onClick={saveProfile} disabled={saving} className="agri-btn-primary w-full !py-3">
        {saving ? "Saving..." : "Save Profile"}
      </button>
      </div>
    </div>
  );
}

export default function CustomerProfilePage() {
  return (
    <CustomerRoute>
      <CustomerProfileInner />
    </CustomerRoute>
  );
}
