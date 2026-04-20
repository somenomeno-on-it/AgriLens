"use client"; //this file must run on the browser

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import {
  getDistrictOptions,
  getUpazilaOptionsForDistrict,
} from "@/src/data/bdRegions";

//farmer and farm object types
type FarmerProfile = {
  _id: string;
  fullName: string;
  phone: string;
  address: string;
  nationalId?: string;
  experienceYears?: number;
  verifiedBadge?: boolean;
  approvedListingCount?: number;
};

type Farm = {
  _id: string;
  name: string;
  location: {
    district: string;
    upazila: string;
    address?: string;
  };
  sizeInAcres?: number;
  description?: string;
};

//Where the API is hosted(local host 3001)
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

//Page's memory state (actual data from the backend)
export default function FarmerPage() {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

//Form's memory state (data that the user is typing in the form)
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    nationalId: "",
    experienceYears: 0,
  });

  const [farmForm, setFarmForm] = useState({
    name: "",
    district: "",
    upazila: "",
    address: "",
    sizeInAcres: "",
    description: "",
  });

  // Edit farm state
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [editFarmForm, setEditFarmForm] = useState({
    name: "",
    district: "",
    upazila: "",
    address: "",
    sizeInAcres: "",
    description: "",
  });

  // Cascading dropdown options from BD regions data
  const districtOptions = useMemo(() => getDistrictOptions(), []);
  const upazilaOptions = useMemo(
    () => getUpazilaOptionsForDistrict(farmForm.district),
    [farmForm.district]
  );
  const editUpazilaOptions = useMemo(
    () => getUpazilaOptionsForDistrict(editFarmForm.district),
    [editFarmForm.district]
  );
  // Track whether edit district was set programmatically (startEditFarm) vs user interaction
  const editDistrictUserChange = useRef(false);

  // Clear upazila whenever district changes (create form)
  useEffect(() => {
    setFarmForm((prev) => ({ ...prev, upazila: "" }));
  }, [farmForm.district]);

  // Clear upazila whenever district changes (edit form) — skip programmatic sets
  useEffect(() => {
    if (!editDistrictUserChange.current) {
      editDistrictUserChange.current = true;
      return;
    }
    setEditFarmForm((prev) => ({ ...prev, upazila: "" }));
  }, [editFarmForm.district]);

//The function loads data when page opens
  useEffect(() => {
    const fetchData = async () => { //this function fetches data from the backend and async=write code top to bottom fast
      try {
        const [profileRes, farmsRes] = await Promise.all([ //Promise.all=call multiple APIs at the same time
          fetch(`${API_BASE}/api/farmer/profile`, {
            headers: getAuthHeaders(), //authentication headers
          }),
          fetch(`${API_BASE}/api/farmer/farms`, {
            headers: getAuthHeaders(),
          }),
        ]);
        //set the profile data to the state
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
          setProfileForm({
            fullName: data.fullName || "",
            phone: data.phone || "",
            address: data.address || "",
            nationalId: data.nationalId || "",
            experienceYears: data.experienceYears || 0,
          });
        }

        if (farmsRes.ok) {
          const farmsData = await farmsRes.json();
          setFarms(farmsData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
//The function saves the profile data to the backend
  const saveProfile = async () => {
    const res = await fetch(`${API_BASE}/api/farmer/profile`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(profileForm),
    });

    if (!res.ok) {
      alert("Failed to save profile");
      return;
    }

    const data = await res.json(); //convert the response to a JSON object
    setProfile(data);
    alert("Profile saved");
  };

  const createFarm = async () => { //The function creates a new farm
    const res = await fetch(`${API_BASE}/api/farmer/farms`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: farmForm.name,
        location: {
          district: farmForm.district,
          upazila: farmForm.upazila,
          address: farmForm.address,
        },
        sizeInAcres: Number(farmForm.sizeInAcres) || undefined,
        description: farmForm.description,
      }),
    });

    if (!res.ok) {
      alert("Failed to create farm");
      return;
    }

    const newFarm: Farm = await res.json();
    setFarms((prev) => [...prev, newFarm]);
    setFarmForm({
      name: "",
      district: "",
      upazila: "",
      address: "",
      sizeInAcres: "",
      description: "",
    });
  };

  const deleteFarm = async (id: string) => { //The function deletes a farm
    const res = await fetch(`${API_BASE}/api/farmer/farms/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      alert("Failed to delete farm");
      return;
    }

    setFarms((prev) => prev.filter((farm) => farm._id !== id)); //filter out the deleted farm
  };

  const startEditFarm = (farm: Farm) => {
    setEditingFarmId(farm._id);
    editDistrictUserChange.current = false; // next district change is programmatic, skip clearing upazila
    setEditFarmForm({
      name: farm.name,
      district: farm.location.district || "",
      upazila: farm.location.upazila || "",
      address: farm.location.address || "",
      sizeInAcres: farm.sizeInAcres != null ? String(farm.sizeInAcres) : "",
      description: farm.description || "",
    });
  };

  const cancelEditFarm = () => {
    setEditingFarmId(null);
  };

  const saveEditFarm = async () => {
    if (!editingFarmId) return;
    const res = await fetch(`${API_BASE}/api/farmer/farms/${editingFarmId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: editFarmForm.name,
        location: {
          district: editFarmForm.district,
          upazila: editFarmForm.upazila,
          address: editFarmForm.address,
        },
        sizeInAcres: Number(editFarmForm.sizeInAcres) || undefined,
        description: editFarmForm.description,
      }),
    });

    if (!res.ok) {
      alert("Failed to update farm");
      return;
    }

    const updated: Farm = await res.json();
    setFarms((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
    setEditingFarmId(null);
  };

  if (loading) { //If the data is still loading, show a loading message
    return <div className="p-6">Loading farmer data...</div>;
  }

  return ( //The function returns the JSX code that will be rendered to the page
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <AnnouncementBanner role="farmer" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold">Farmer &amp; Farm Management</h1>
          {profile?.verifiedBadge && (
            <span
              title={`Verified Farmer — ${profile.approvedListingCount ?? 0} approved listings`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 12px",
                borderRadius: "9999px",
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                color: "#fff",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.02em",
                boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Verified Farmer
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/produce">My Listings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/farmer/complaints">My Complaints</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">Farmer Profile</h2>
        {profile?.verifiedBadge && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
              border: "1px solid #86efac",
              color: "#15803d",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Verified Farmer · {profile.approvedListingCount ?? 0} approved listings
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Full Name"
            value={profileForm.fullName}
            onChange={(e) =>
              setProfileForm({ ...profileForm, fullName: e.target.value })
            }
          />
          <Input
            placeholder="Phone"
            value={profileForm.phone}
            onChange={(e) =>
              setProfileForm({ ...profileForm, phone: e.target.value })
            }
          />
          <Input
            placeholder="Address"
            value={profileForm.address}
            onChange={(e) =>
              setProfileForm({ ...profileForm, address: e.target.value })
            }
          />
          <Input
            placeholder="National ID (optional)"
            value={profileForm.nationalId}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                nationalId: e.target.value,
              })
            }
          />
          <Input
            type="number"
            placeholder="Years of experience"
            value={profileForm.experienceYears}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                experienceYears: Number(e.target.value) || 0,
              })
            }
          />
        </div>
        <Button className="mt-4" onClick={saveProfile}>
          Save Profile
        </Button>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">Farms</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Farm name"
            value={farmForm.name}
            onChange={(e) =>
              setFarmForm({ ...farmForm, name: e.target.value })
            }
          />

          {/* District dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">District</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={farmForm.district}
              onChange={(e) =>
                setFarmForm({ ...farmForm, district: e.target.value })
              }
            >
              <option value="">Choose district</option>
              {districtOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Upazila dropdown — disabled until district is selected */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Upazila</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              value={farmForm.upazila}
              onChange={(e) =>
                setFarmForm({ ...farmForm, upazila: e.target.value })
              }
              disabled={!farmForm.district}
            >
              <option value="">Choose upazila</option>
              {upazilaOptions.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            placeholder="Address"
            value={farmForm.address}
            onChange={(e) =>
              setFarmForm({ ...farmForm, address: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Size (acres)"
            value={farmForm.sizeInAcres}
            onChange={(e) =>
              setFarmForm({
                ...farmForm,
                sizeInAcres: e.target.value,
              })
            }
          />
          <Input
            placeholder="Description"
            value={farmForm.description}
            onChange={(e) =>
              setFarmForm({
                ...farmForm,
                description: e.target.value,
              })
            }
          />
        </div>

        <Button className="mt-4" onClick={createFarm}>
          Add Farm
        </Button>

        <div className="mt-6 space-y-3">
          {farms.map((farm) =>
            editingFarmId === farm._id ? (
              /* ---- Inline edit form ---- */
              <Card key={farm._id} className="p-4 space-y-3 border-2 border-primary/30">
                <div className="text-sm font-semibold text-muted-foreground">Editing farm</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Farm name"
                    value={editFarmForm.name}
                    onChange={(e) =>
                      setEditFarmForm({ ...editFarmForm, name: e.target.value })
                    }
                  />

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">District</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={editFarmForm.district}
                      onChange={(e) =>
                        setEditFarmForm({ ...editFarmForm, district: e.target.value })
                      }
                    >
                      <option value="">Choose district</option>
                      {districtOptions.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Upazila</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      value={editFarmForm.upazila}
                      onChange={(e) =>
                        setEditFarmForm({ ...editFarmForm, upazila: e.target.value })
                      }
                      disabled={!editFarmForm.district}
                    >
                      <option value="">Choose upazila</option>
                      {editUpazilaOptions.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    placeholder="Address"
                    value={editFarmForm.address}
                    onChange={(e) =>
                      setEditFarmForm({ ...editFarmForm, address: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Size (acres)"
                    value={editFarmForm.sizeInAcres}
                    onChange={(e) =>
                      setEditFarmForm({ ...editFarmForm, sizeInAcres: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Description"
                    value={editFarmForm.description}
                    onChange={(e) =>
                      setEditFarmForm({ ...editFarmForm, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEditFarm}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditFarm}>
                    Cancel
                  </Button>
                </div>
              </Card>
            ) : (
              /* ---- Read-only farm card ---- */
              <Card
                key={farm._id}
                className="p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{farm.name}</div>
                  <div className="text-sm text-zinc-500">
                    {farm.location.district}, {farm.location.upazila}
                  </div>
                  {farm.sizeInAcres != null && (
                    <div className="text-sm text-zinc-400">{farm.sizeInAcres} acres</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditFarm(farm)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteFarm(farm._id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            )
          )}
          {farms.length === 0 && (
            <div className="text-sm text-zinc-500">No farms yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

