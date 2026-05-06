"use client"; //this file must run on the browser

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

// ─── Month name helper ───────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Types ───────────────────────────────────────────────────────────────────
type Recommendation = {
  rank: number;
  cropName: string;
  rationale: string;
};

type RecommendationResult = {
  farmId: string;
  upazila: string;
  currentMonth: number;
  recommendations: Recommendation[];
};

// ─── Seasonal Recommendation Card ────────────────────────────────────────────
function SeasonalRecommendationCard({ farmId, upazila }: { farmId: string; upazila: string }) {
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/recommendations?farmId=${farmId}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Could not load recommendations");
      const json: RecommendationResult = await res.json();
      setData(json);
    } catch {
      setError("Unable to load seasonal recommendations.");
    } finally {
      setLoading(false);
    }
  }, [farmId, API_BASE]);

  useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  // Crop emoji map (best-effort)
  const cropEmoji: Record<string, string> = {
    "Boro Rice": "🌾", "Aus Rice": "🌾", "Aman Rice": "🌾",
    "Potato": "🥔", "Mustard": "🌻", "Lentil (Masur)": "🫘",
    "Onion": "🧅", "Garlic": "🧄", "Wheat": "🌾",
    "Chickpea (Boot)": "🫘", "Tomato": "🍅", "Cauliflower": "🥦",
    "Cabbage": "🥬", "Carrot": "🥕", "Eggplant (Brinjal)": "🍆",
    "Bitter Gourd (Karela)": "🥒", "Ridge Gourd": "🥒",
    "Summer Tomato": "🍅", "Pointed Gourd (Potol)": "🥒",
    "Bottle Gourd (Lau)": "🫙", "Snake Gourd": "🥒",
    "Okra (Dharosh)": "🫑", "Mango": "🥭", "Jackfruit": "🍈",
    "Banana": "🍌", "Pineapple": "🍍", "Litchi": "🍒", "Guava": "🍐",
    "Jute (Kenaph / Tossa)": "🌿", "Sugarcane": "🎋", "Maize": "🌽",
    "Chilli (Red Pepper)": "🌶️", "Coriander": "🌿",
    "Turmeric": "🟡", "Ginger": "🫚",
  };

  const rankColor = ["#16a34a", "#0284c7", "#7c3aed", "#b45309", "#dc2626"];
  const rankLabel = ["1st", "2nd", "3rd", "4th", "5th"];

  return (
    <div
      style={{
        marginTop: "16px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)",
        border: "1.5px solid #86efac",
        padding: "20px 20px 16px",
        boxShadow: "0 4px 24px rgba(22,163,74,0.10)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "22px" }}>🌱</span>
          <div>
            <div style={{ fontSize: "0.97rem", fontWeight: 700, color: "#14532d" }}>
              Seasonal Crop Recommendations
            </div>
            <div style={{ fontSize: "0.75rem", color: "#15803d", marginTop: "1px" }}>
              {data
                ? `For ${upazila} · ${MONTH_NAMES[data.currentMonth - 1]}`
                : `For ${upazila}`}
            </div>
          </div>
        </div>
        <button
          onClick={fetchRecs}
          disabled={loading}
          title="Refresh recommendations"
          style={{
            background: "none", border: "none", cursor: loading ? "default" : "pointer",
            fontSize: "18px", opacity: loading ? 0.5 : 1,
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = "rotate(180deg)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          🔄
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "18px 0", color: "#15803d", fontSize: "0.85rem" }}>
          <span style={{ display: "inline-block", animation: "spin 1s linear infinite", marginRight: "6px" }}>⏳</span>
          Calculating best crops for your farm…
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{
          padding: "10px 14px", borderRadius: "10px",
          background: "#fef2f2", border: "1px solid #fecaca",
          color: "#dc2626", fontSize: "0.83rem",
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && data && data.recommendations.length === 0 && (
        <div style={{ padding: "10px 0", color: "#6b7280", fontSize: "0.85rem" }}>
          No seasonal recommendations available for <strong>{upazila}</strong> this month.
        </div>
      )}

      {!loading && data && data.recommendations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.recommendations.map((rec) => (
            <div
              key={rec.rank}
              onClick={() => setExpanded(expanded === rec.rank ? null : rec.rank)}
              style={{
                borderRadius: "12px",
                background: expanded === rec.rank
                  ? "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)"
                  : "#ffffff",
                border: `1.5px solid ${expanded === rec.rank ? rankColor[rec.rank - 1] + "60" : "#e2e8f0"}`,
                padding: "10px 14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: expanded === rec.rank
                  ? `0 2px 12px ${rankColor[rec.rank - 1]}22`
                  : "0 1px 3px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                if (expanded !== rec.rank) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = rankColor[rec.rank - 1] + "80";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (expanded !== rec.rank) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0";
                  (e.currentTarget as HTMLDivElement).style.transform = "";
                }
              }}
            >
              {/* Row: rank badge + name + emoji + chevron */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    minWidth: "32px", height: "32px",
                    borderRadius: "50%",
                    background: rankColor[rec.rank - 1],
                    color: "#fff",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {rankLabel[rec.rank - 1]}
                </span>
                <span style={{ fontSize: "20px", flexShrink: 0 }}>
                  {cropEmoji[rec.cropName] ?? "🌿"}
                </span>
                <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1a2e1b", flex: 1 }}>
                  {rec.cropName}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem", color: "#15803d",
                    transition: "transform 0.2s",
                    transform: expanded === rec.rank ? "rotate(180deg)" : "",
                    display: "inline-block",
                  }}
                >
                  ▼
                </span>
              </div>

              {/* Expanded rationale */}
              {expanded === rec.rank && (
                <div
                  style={{
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "1px solid #dcfce7",
                    fontSize: "0.8rem",
                    color: "#374151",
                    lineHeight: 1.6,
                  }}
                >
                  {rec.rationale}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer note */}
      {!loading && data && (
        <div style={{ marginTop: "12px", fontSize: "0.7rem", color: "#6b7280", textAlign: "right" }}>
          Based on DAE Bangladesh agro-climatic calendar · Click any crop to read why it&apos;s recommended
        </div>
      )}
    </div>
  );
}


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
            <Link href="/farmer/orders">📬 Order Inbox</Link>
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Full Name</label>
            <Input
              placeholder="e.g. Rahim Uddin"
              value={profileForm.fullName}
              onChange={(e) =>
                setProfileForm({ ...profileForm, fullName: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Phone</label>
            <Input
              placeholder="e.g. 01711-000000"
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm({ ...profileForm, phone: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Address</label>
            <Input
              placeholder="e.g. Village, Upazila, District"
              value={profileForm.address}
              onChange={(e) =>
                setProfileForm({ ...profileForm, address: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">National ID (optional)</label>
            <Input
              placeholder="e.g. 1234567890"
              value={profileForm.nationalId}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  nationalId: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Years of Experience</label>
            <Input
              type="number"
              placeholder="e.g. 5"
              value={profileForm.experienceYears}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  experienceYears: Number(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
        <Button className="mt-4" onClick={saveProfile}>
          Save Profile
        </Button>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">Farms</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Farm Name</label>
            <Input
              placeholder="e.g. Green Valley Farm"
              value={farmForm.name}
              onChange={(e) =>
                setFarmForm({ ...farmForm, name: e.target.value })
              }
            />
          </div>

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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Address</label>
            <Input
              placeholder="e.g. Village road, near market"
              value={farmForm.address}
              onChange={(e) =>
                setFarmForm({ ...farmForm, address: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Size (acres)</label>
            <Input
              type="number"
              placeholder="e.g. 3.5"
              value={farmForm.sizeInAcres}
              onChange={(e) =>
                setFarmForm({
                  ...farmForm,
                  sizeInAcres: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Description</label>
            <Input
              placeholder="e.g. Paddy and vegetable farm"
              value={farmForm.description}
              onChange={(e) =>
                setFarmForm({
                  ...farmForm,
                  description: e.target.value,
                })
              }
            />
          </div>
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
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Farm Name</label>
                    <Input
                      placeholder="e.g. Green Valley Farm"
                      value={editFarmForm.name}
                      onChange={(e) =>
                        setEditFarmForm({ ...editFarmForm, name: e.target.value })
                      }
                    />
                  </div>

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

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Address</label>
                    <Input
                      placeholder="e.g. Village road, near market"
                      value={editFarmForm.address}
                      onChange={(e) =>
                        setEditFarmForm({ ...editFarmForm, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Size (acres)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 3.5"
                      value={editFarmForm.sizeInAcres}
                      onChange={(e) =>
                        setEditFarmForm({ ...editFarmForm, sizeInAcres: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Description</label>
                    <Input
                      placeholder="e.g. Paddy and vegetable farm"
                      value={editFarmForm.description}
                      onChange={(e) =>
                        setEditFarmForm({ ...editFarmForm, description: e.target.value })
                      }
                    />
                  </div>
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
                className="p-4 space-y-0"
              >
                <div className="flex items-center justify-between">
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
                </div>
                {/* Seasonal recommendations card — auto-loads for this farm */}
                {farm.location.upazila && (
                  <SeasonalRecommendationCard
                    farmId={farm._id}
                    upazila={farm.location.upazila}
                  />
                )}
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

