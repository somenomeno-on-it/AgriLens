"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [analytics, setAnalytics] = useState<FarmerAnalyticsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        // Crop type dropdown will still work with "all".
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
    // Intentionally only run once for initial defaults.
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
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Produce History & Analytics</h1>
          <div className="text-sm text-zinc-500">
            Price trends and quantity summaries based on status changes.
          </div>
        </div>
        <LogoutButton />
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-sm font-medium">Start date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">End date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Crop type</label>
            <select
              className="border rounded px-3 py-2 w-full text-sm"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
            >
              <option value="all">All crops</option>
              {cropTypes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Button onClick={onUpdate} disabled={submitting}>
              {submitting ? "Updating..." : "Update analytics"}
            </Button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Price over time</h2>
            <div className="text-sm text-zinc-500">
              {cropType === "all" ? "All crops" : cropType}
            </div>
          </div>
          {loading ? (
            <div className="text-sm text-zinc-500">Loading chart...</div>
          ) : priceSeries.length === 0 ? (
            <div className="text-sm text-zinc-500">
              No status-change snapshots in the selected range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#16a34a" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Quantity per crop</h2>
            <div className="text-sm text-zinc-500">
              Based on the latest listing snapshot per crop within the range.
            </div>
          </div>
          {loading ? (
            <div className="text-sm text-zinc-500">Loading chart...</div>
          ) : quantityByCrop.length === 0 ? (
            <div className="text-sm text-zinc-500">
              No quantity summaries available in the selected range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={quantityByCrop}
                margin={{ top: 5, right: 10, bottom: 30, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cropType" interval={0} angle={-30} textAnchor="end" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

