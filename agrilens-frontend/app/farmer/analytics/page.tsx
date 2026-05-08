"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import type { FarmerAnalyticsResponse } from "@/lib/analytics";
import { fetchFarmerAnalytics } from "@/lib/analytics";
import { getAuthHeaders } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

type ProduceListing = {
  _id: string;
  cropType: string;
  status: "pending" | "approved" | "rejected";
};

const API_BASE = 
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

function toISOStart(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((x) => Number(x));
  const dt = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  return dt.toISOString();
}

function toISOEnd(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((x) => Number(x));
  const dt = new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
  return dt.toISOString();
}

function formatDateInput(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function FarmerAnalyticsPage() {
  const defaultEnd = useMemo(() => formatDateInput(new Date()), []);
  const defaultStart = useMemo(() => {
    const d = new Date(); 
    d.setDate(d.getDate() - 30);
    return formatDateInput(d);
  }, []);

  const [cropTypes, setCropTypes] = useState<string[]>([]);
  const [cropType, setCropType] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);

  const [analytics, setAnalytics] = useState<FarmerAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() =>  {
    const loadCropTypesAndInitialAnalytics = async () => {
      setLoading(true);
      setError(null);

      let effectiveCropType = cropType;
      try {
        const res = await fetch(`${API_BASE}/api/produce`, {
          headers: getAuthHeaders(),
          cache: "no-store", 
        });
        if (res.ok) {
          const listings: ProduceListing[] = await res.json(); 
          const unique = Array.from(
            new Set(listings.map((l) => l.cropType).filter(Boolean))
          ).sort((a, b) => a.localeCompare(b));
          setCropTypes(unique);

          if (
            effectiveCropType !== "all" && 
            unique.length > 0 &&
            !unique.includes(effectiveCropType)
          ) {
            effectiveCropType = unique[0];
            setCropType(unique[0]);
          }
        }
      } catch {
        // silently handle
      }

      try {
        const data = await fetchFarmerAnalytics({
          startDate: toISOStart(startDate),
          endDate: toISOEnd(endDate),
          cropType: effectiveCropType,
        });
        setAnalytics(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    loadCropTypesAndInitialAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUpdate = async () => {
    setSubmitting(true); 
    setError(null);
    try {
      const data = await fetchFarmerAnalytics({
        startDate: toISOStart(startDate),
        endDate: toISOEnd(endDate),
        cropType,
      });
      setAnalytics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setSubmitting(false);
    }
  };

  const priceSeries = analytics?.priceSeries ?? [];
  const quantityByCrop = analytics?.quantityByCrop ?? [];

  return (
    <div className="agri-page space-y-6">
      <div className="agri-page-header flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="agri-page-title">Produce History & Analytics</h1>
          <p className="agri-page-subtitle">Track price trends and listing quantities over time</p>
        </div>
        <LogoutButton />
      </div>

      <div className="agri-section" style={{ padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
          <div className="agri-field">
            <label className="agri-label">Start date</label>
            <input
              type="date"
              style={{ height: "42px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 12px" }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="agri-field">
            <label className="agri-label">End date</label>
            <input
              type="date"
              style={{ height: "42px", borderRadius: "10px", border: "1.5px solid #bbf7d0", padding: "0 12px" }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="agri-field">
            <label className="agri-label">Crop type</label>
            <select
              className="agri-select"
              style={{ height: "42px" }}
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
            >
              <option value="all">All crops</option>
              {cropTypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <button 
              className="agri-btn-primary" 
              style={{ width: "100%", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              onClick={onUpdate} 
              disabled={submitting}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              {submitting ? "Updating..." : "Update Chart"}
            </button>
          </div>
        </div>

        {error && <div style={{ marginTop: "16px", padding: "10px 14px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626", fontSize: "0.85rem", border: "1px solid #fecaca" }}>{error}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        <div className="agri-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1c1917" }}>Price Trend</h2>
              <p style={{ fontSize: "0.8rem", color: "#78716c", marginTop: "2px" }}>{cropType === "all" ? "Averaged across all crops" : `Historical price for ${cropType}`}</p>
            </div>
            <div style={{ padding: "6px 12px", background: "#f0fdf4", borderRadius: "8px", color: "#16a34a", fontSize: "0.75rem", fontWeight: 700 }}>
              BDT / unit
            </div>
          </div>
          {loading ? (
            <div className="agri-skeleton" style={{ height: "300px", borderRadius: "12px" }} />
          ) : priceSeries.length === 0 ? (
            <div className="agri-empty" style={{ height: "300px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p className="agri-empty-text">No price data available for this range.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="date" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: '#16a34a', fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: "#16a34a", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="agri-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyItems: "space-between", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1c1917" }}>Inventory Distribution</h2>
              <p style={{ fontSize: "0.8rem", color: "#78716c", marginTop: "2px" }}>Current quantity per crop type</p>
            </div>
          </div>
          {loading ? (
            <div className="agri-skeleton" style={{ height: "300px", borderRadius: "12px" }} />
          ) : quantityByCrop.length === 0 ? (
            <div className="agri-empty" style={{ height: "300px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p className="agri-empty-text">No inventory data available for this range.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quantityByCrop} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="cropType" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" />
                <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  cursor={{ fill: '#f0fdf4' }}
                />
                <Bar dataKey="quantity" fill="#fbbf24" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
