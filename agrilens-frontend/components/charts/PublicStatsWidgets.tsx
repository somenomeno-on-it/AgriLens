"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

interface TopCrop {
  cropType: string;
  totalQuantity: number;
  count: number;
}

interface MonthlyTrend {
  month: string;
  quantity: number;
}

interface StatsData {
  activeFarms: number;
  topCrops: TopCrop[];
  monthlyTrends: MonthlyTrend[];
}

export function PublicStatsWidgets({
  district = "",
  upazila = "",
  radius = 0,
  mapCenter = [23.8, 90.4] as [number, number],
}: {
  district?: string;
  upazila?: string;
  radius?: number;
  mapCenter?: [number, number];
}) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (district) query.append("district", district);
        if (upazila) query.append("upazila", upazila);
        if (radius > 0) {
          query.append("lat", mapCenter[0].toString());
          query.append("lng", mapCenter[1].toString());
          query.append("radius", radius.toString());
        }

        const res = await fetch(`${API_BASE}/api/public/stats?${query.toString()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setStats(data);
        }
      } catch (e) {
        console.error("Failed to load stats", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const timeout = setTimeout(loadStats, 500);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [district, upazila, radius, mapCenter]);

  if (loading && !stats) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading market insights...</div>;
  }

  if (!stats) return null;

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Active Farms Card */}
      <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 flex flex-col justify-center items-center">
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Active Farms Listed</h3>
        <p className="text-5xl font-bold text-primary">{stats.activeFarms}</p>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Farmers continuously supplying fresh produce
        </p>
      </div>

      {/* Top Crops Chart */}
      <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 md:col-span-1">
        <h3 className="text-lg font-medium mb-4">Top Crops by Volume (kg)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topCrops}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="cropType" />
              <YAxis />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }}
              />
              <Bar dataKey="totalQuantity" fill="var(--color-primary, #16a34a)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 md:col-span-1">
        <h3 className="text-lg font-medium mb-4">Upcoming Harvest Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }}
              />
              <Line
                type="monotone"
                dataKey="quantity"
                stroke="var(--color-primary, #16a34a)"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
