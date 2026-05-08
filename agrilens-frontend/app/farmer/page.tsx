"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { getAuthHeaders } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import {
  getDistrictOptions,
  getUpazilaOptionsForDistrict,
} from "@/src/data/bdRegions";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "32px", height: "32px", borderRadius: "8px", background: "#fff",
            boxShadow: "0 2px 8px rgba(22,163,74,0.15)"
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
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
            padding: "4px", borderRadius: "6px", color: "#15803d",
            transition: "all 0.2s ease",
            opacity: loading ? 0.5 : 1,
          }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "rgba(22,163,74,0.1)"; e.currentTarget.style.transform = "rotate(180deg)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.transform = "none"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "18px 0", color: "#15803d", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <div className="agri-spinner" style={{ width: "16px", height: "16px", border: "2px solid #bbf7d0", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          Calculating best crops for your farm…
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "0.83rem" }}>
          {error}
        </div>
      )}

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
                background: expanded === rec.rank ? "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)" : "#ffffff",
                border: `1.5px solid ${expanded === rec.rank ? rankColor[rec.rank - 1] + "60" : "#e2e8f0"}`,
                padding: "10px 14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: expanded === rec.rank ? `0 2px 12px ${rankColor[rec.rank - 1]}22` : "0 1px 3px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                if (expanded !== rec.rank) {
                  e.currentTarget.style.borderColor = rankColor[rec.rank - 1] + "80";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (expanded !== rec.rank) {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "";
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ minWidth: "32px", height: "32px", borderRadius: "50%", background: rankColor[rec.rank - 1], color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, flexShrink: 0 }}>
                  {rankLabel[rec.rank - 1]}
                </span>
                <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1a2e1b", flex: 1 }}>
                  {rec.cropName}
                </span>
                <span style={{ fontSize: "0.7rem", color: "#15803d", transition: "transform 0.2s", transform: expanded === rec.rank ? "rotate(180deg)" : "", display: "inline-block" }}>
                  ▼
                </span>
              </div>
              {expanded === rec.rank && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #dcfce7", fontSize: "0.8rem", color: "#374151", lineHeight: 1.6 }}>
                  {rec.rationale}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && data && (
        <div style={{ marginTop: "12px", fontSize: "0.7rem", color: "#6b7280", textAlign: "right" }}>
          Based on DAE Bangladesh agro-climatic calendar
        </div>
      )}
    </div>
  );
}

type FarmerProfile = {
  _id: string; fullName: string; phone: string; address: string;
  nationalId?: string; experienceYears?: number; verifiedBadge?: boolean; approvedListingCount?: number;
};

type Farm = {
  _id: string; name: string;
  location: { district: string; upazila: string; address?: string; };
  sizeInAcres?: number; description?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export default function FarmerPage() {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({
    fullName: "", phone: "", address: "", nationalId: "", experienceYears: 0,
  });

  const [farmForm, setFarmForm] = useState({
    name: "", district: "", upazila: "", address: "", sizeInAcres: "", description: "",
  });

  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [editFarmForm, setEditFarmForm] = useState({
    name: "", district: "", upazila: "", address: "", sizeInAcres: "", description: "",
  });

  const districtOptions = useMemo(() => getDistrictOptions(), []);
  const upazilaOptions = useMemo(() => getUpazilaOptionsForDistrict(farmForm.district), [farmForm.district]);
  const editUpazilaOptions = useMemo(() => getUpazilaOptionsForDistrict(editFarmForm.district), [editFarmForm.district]);
  const editDistrictUserChange = useRef(false);

  useEffect(() => { setFarmForm((prev) => ({ ...prev, upazila: "" })); }, [farmForm.district]);
  useEffect(() => {
    if (!editDistrictUserChange.current) { editDistrictUserChange.current = true; return; }
    setEditFarmForm((prev) => ({ ...prev, upazila: "" }));
  }, [editFarmForm.district]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, farmsRes] = await Promise.all([
          fetch(`${API_BASE}/api/farmer/profile`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/api/farmer/farms`, { headers: getAuthHeaders() }),
        ]);
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
          setProfileForm({
            fullName: data.fullName || "", phone: data.phone || "",
            address: data.address || "", nationalId: data.nationalId || "",
            experienceYears: data.experienceYears || 0,
          });
        }
        if (farmsRes.ok) setFarms(await farmsRes.json());
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const saveProfile = async () => {
    const res = await fetch(`${API_BASE}/api/farmer/profile`, {
      method: "POST", headers: getAuthHeaders(), body: JSON.stringify(profileForm),
    });
    if (!res.ok) { alert("Failed to save profile"); return; }
    setProfile(await res.json());
    alert("Profile saved successfully");
  };

  const createFarm = async () => {
    const res = await fetch(`${API_BASE}/api/farmer/farms`, {
      method: "POST", headers: getAuthHeaders(),
      body: JSON.stringify({
        name: farmForm.name,
        location: { district: farmForm.district, upazila: farmForm.upazila, address: farmForm.address },
        sizeInAcres: Number(farmForm.sizeInAcres) || undefined, description: farmForm.description,
      }),
    });
    if (!res.ok) { alert("Failed to create farm"); return; }
    const newFarm = await res.json();
    setFarms((prev) => [...prev, newFarm]);
    setFarmForm({ name: "", district: "", upazila: "", address: "", sizeInAcres: "", description: "" });
  };

  const deleteFarm = async (id: string) => {
    if (!window.confirm("Delete this farm?")) return;
    const res = await fetch(`${API_BASE}/api/farmer/farms/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    if (!res.ok) { alert("Failed to delete farm"); return; }
    setFarms((prev) => prev.filter((farm) => farm._id !== id));
  };

  const startEditFarm = (farm: Farm) => {
    setEditingFarmId(farm._id);
    editDistrictUserChange.current = false;
    setEditFarmForm({
      name: farm.name, district: farm.location.district || "", upazila: farm.location.upazila || "",
      address: farm.location.address || "", sizeInAcres: farm.sizeInAcres != null ? String(farm.sizeInAcres) : "",
      description: farm.description || "",
    });
  };

  const saveEditFarm = async () => {
    if (!editingFarmId) return;
    const res = await fetch(`${API_BASE}/api/farmer/farms/${editingFarmId}`, {
      method: "PUT", headers: getAuthHeaders(),
      body: JSON.stringify({
        name: editFarmForm.name,
        location: { district: editFarmForm.district, upazila: editFarmForm.upazila, address: editFarmForm.address },
        sizeInAcres: Number(editFarmForm.sizeInAcres) || undefined, description: editFarmForm.description,
      }),
    });
    if (!res.ok) { alert("Failed to update farm"); return; }
    const updated: Farm = await res.json();
    setFarms((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
    setEditingFarmId(null);
  };

  if (loading) return (
    <div className="agri-page">
      <div className="agri-skeleton" style={{ height: "160px", marginBottom: "24px" }} />
      <div className="agri-skeleton" style={{ height: "400px" }} />
    </div>
  );

  return (
    <div className="agri-page space-y-6">
      <AnnouncementBanner role="farmer" />

      <div className="agri-page-header flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="agri-page-title">Farmer Dashboard</h1>
          {profile?.verifiedBadge && (
            <span className="agri-verified-badge" title={`${profile.approvedListingCount ?? 0} approved listings`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Verified
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/produce" className="agri-btn-outline" style={{ textDecoration: "none" }}>My Listings</Link>
          <Link href="/farmer/orders" className="agri-btn-outline" style={{ textDecoration: "none" }}>Order Inbox</Link>
          <Link href="/farmer/complaints" className="agri-btn-outline" style={{ textDecoration: "none" }}>Complaints</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="agri-section">
        <h2 className="agri-section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Personal Profile
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <div className="agri-field"><label className="agri-label">Full Name</label><input className="agri-input" style={{ height: "42px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 12px" }} value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} /></div>
          <div className="agri-field"><label className="agri-label">Phone</label><input className="agri-input" style={{ height: "42px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 12px" }} value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
          <div className="agri-field"><label className="agri-label">Address</label><input className="agri-input" style={{ height: "42px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 12px" }} value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} /></div>
          <div className="agri-field"><label className="agri-label">National ID (optional)</label><input className="agri-input" style={{ height: "42px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 12px" }} value={profileForm.nationalId} onChange={(e) => setProfileForm({ ...profileForm, nationalId: e.target.value })} /></div>
          <div className="agri-field"><label className="agri-label">Years of Experience</label><input type="number" className="agri-input" style={{ height: "42px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 12px" }} value={profileForm.experienceYears} onChange={(e) => setProfileForm({ ...profileForm, experienceYears: Number(e.target.value) || 0 })} /></div>
        </div>
        <button className="agri-btn-primary" style={{ marginTop: "20px" }} onClick={saveProfile}>Save Profile</button>
      </div>

      <div className="agri-section">
        <h2 className="agri-section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14h18"/><path d="M12 2v20"/><path d="M3 7h18"/><path d="M3 21h18"/></svg>
          Farm Management
        </h2>
        
        <div style={{ background: "#f0fdf4", padding: "20px", borderRadius: "16px", border: "1.5px solid #dcfce7", marginBottom: "32px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#14532d", marginBottom: "16px" }}>Register a New Farm</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div className="agri-field"><label className="agri-label">Farm Name</label><input className="agri-input" style={{ height: "42px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 12px" }} value={farmForm.name} onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })} /></div>
            <div className="agri-field"><label className="agri-label">District</label><select className="agri-select" value={farmForm.district} onChange={(e) => setFarmForm({ ...farmForm, district: e.target.value })}><option value="">Select District</option>{districtOptions.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}</select></div>
            <div className="agri-field"><label className="agri-label">Upazila</label><select className="agri-select" value={farmForm.upazila} onChange={(e) => setFarmForm({ ...farmForm, upazila: e.target.value })} disabled={!farmForm.district}><option value="">Select Upazila</option>{upazilaOptions.map((u) => (<option key={u.value} value={u.value}>{u.label}</option>))}</select></div>
            <div className="agri-field"><label className="agri-label">Address</label><input className="agri-input" style={{ height: "42px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 12px" }} value={farmForm.address} onChange={(e) => setFarmForm({ ...farmForm, address: e.target.value })} /></div>
            <div className="agri-field"><label className="agri-label">Size (acres)</label><input type="number" className="agri-input" style={{ height: "42px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 12px" }} value={farmForm.sizeInAcres} onChange={(e) => setFarmForm({ ...farmForm, sizeInAcres: e.target.value })} /></div>
            <div className="agri-field"><label className="agri-label">Description</label><input className="agri-input" style={{ height: "42px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 12px" }} value={farmForm.description} onChange={(e) => setFarmForm({ ...farmForm, description: e.target.value })} /></div>
          </div>
          <button className="agri-btn-primary" style={{ marginTop: "16px" }} onClick={createFarm}>Add Farm</button>
        </div>

        <div className="space-y-4">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1c1917" }}>Your Registered Farms</h3>
          {farms.length === 0 && <div className="agri-empty" style={{ padding: "32px 16px" }}><p className="agri-empty-text">No farms registered yet.</p></div>}
          
          {farms.map((farm) => (
            editingFarmId === farm._id ? (
              <div key={farm._id} style={{ padding: "20px", borderRadius: "16px", border: "2px solid #22c55e", background: "#fff" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#16a34a", marginBottom: "16px" }}>Editing Farm</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div className="agri-field"><label className="agri-label">Farm Name</label><input className="agri-input" style={{ height: "40px", borderRadius: "8px", border: "1px solid #dcfce7", padding: "0 10px" }} value={editFarmForm.name} onChange={(e) => setEditFarmForm({ ...editFarmForm, name: e.target.value })} /></div>
                  <div className="agri-field"><label className="agri-label">District</label><select className="agri-select" style={{ height: "40px" }} value={editFarmForm.district} onChange={(e) => setEditFarmForm({ ...editFarmForm, district: e.target.value })}><option value="">Select District</option>{districtOptions.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}</select></div>
                  <div className="agri-field"><label className="agri-label">Upazila</label><select className="agri-select" style={{ height: "40px" }} value={editFarmForm.upazila} onChange={(e) => setEditFarmForm({ ...editFarmForm, upazila: e.target.value })} disabled={!editFarmForm.district}><option value="">Select Upazila</option>{editUpazilaOptions.map((u) => (<option key={u.value} value={u.value}>{u.label}</option>))}</select></div>
                  <div className="agri-field"><label className="agri-label">Address</label><input className="agri-input" style={{ height: "40px", borderRadius: "8px", border: "1px solid #dcfce7", padding: "0 10px" }} value={editFarmForm.address} onChange={(e) => setEditFarmForm({ ...editFarmForm, address: e.target.value })} /></div>
                  <div className="agri-field"><label className="agri-label">Size (acres)</label><input type="number" className="agri-input" style={{ height: "40px", borderRadius: "8px", border: "1px solid #dcfce7", padding: "0 10px" }} value={editFarmForm.sizeInAcres} onChange={(e) => setEditFarmForm({ ...editFarmForm, sizeInAcres: e.target.value })} /></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="agri-btn-primary" style={{ padding: "6px 16px", fontSize: "0.8rem" }} onClick={saveEditFarm}>Save</button>
                  <button className="agri-btn-outline" style={{ padding: "6px 16px", fontSize: "0.8rem" }} onClick={() => setEditingFarmId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div key={farm._id} className="agri-card" style={{ padding: "20px" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1c1917" }}>{farm.name}</h4>
                    <p style={{ fontSize: "0.85rem", color: "#78716c", marginTop: "4px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: "4px", verticalAlign: "-2px" }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {farm.location.district}, {farm.location.upazila}
                    </p>
                    {farm.sizeInAcres != null && (
                      <p style={{ fontSize: "0.8rem", color: "#15803d", fontWeight: 600, marginTop: "4px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: "4px", verticalAlign: "-2px" }}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                        {farm.sizeInAcres} acres
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="agri-btn-outline" style={{ padding: "6px 14px", fontSize: "0.8rem" }} onClick={() => startEditFarm(farm)}>Edit</button>
                    <button className="agri-btn-danger" style={{ padding: "6px 14px", fontSize: "0.8rem" }} onClick={() => deleteFarm(farm._id)}>Delete</button>
                  </div>
                </div>
                {farm.location.upazila && (
                  <SeasonalRecommendationCard farmId={farm._id} upazila={farm.location.upazila} />
                )}
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
