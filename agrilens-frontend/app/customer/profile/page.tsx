"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed";

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
    return <div className="p-6">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <LogoutButton />
      </div>

      {profile?.email && (
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium">{profile.email}</span>
        </p>
      )}

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Personal Information</h2>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Your phone number"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Address</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Division — free text */}
          <div className="grid gap-2">
            <Label htmlFor="division">Division</Label>
            <Input
              id="division"
              value={form.division}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
              placeholder="e.g. Dhaka"
            />
          </div>

          {/* District — dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">District</label>
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
            <label className="text-xs font-medium text-zinc-500">Upazila</label>
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
            <Label htmlFor="details">Street / Details</Label>
            <Input
              id="details"
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              placeholder="Street address, house no., etc."
            />
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Button onClick={saveProfile} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Profile"}
      </Button>
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
