"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { useInterval } from "@/hooks/useInterval";
import { getAssignedRegions, getAuthHeaders, getCurrentUserId } from "@/lib/auth";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import {
  ListTodo,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type DashboardListing = {
  id: string;
  produceName: string;
  harvestDate?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  status: "pending" | "approved" | "rejected";
  farmerName: string;
};

type DashboardResponse = {
  data: DashboardListing[];
};

type StatsResponse = {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  approvalRate: number;
};

function getAgentContext() {
  const id = getCurrentUserId();
  const assignedRegions = getAssignedRegions();
  return { id, assignedRegions };
}

function statusBadgeClass(status: DashboardListing["status"]) {
  if (status === "approved") return "agri-badge agri-badge-approved";
  if (status === "rejected") return "agri-badge agri-badge-rejected";
  return "agri-badge agri-badge-pending";
}

function MetricCard({ label, value, icon: Icon, accent = "bg-primary/10 text-primary" }: any) {
  return (
    <Card className="agri-stat-card flex items-start gap-4">
      <div className={`rounded-lg p-2.5 shrink-0 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums truncate text-[var(--agri-green-900)]">{value}</p>
      </div>
    </Card>
  );
}

export default function AgentDashboardPage() {
  const [items, setItems] = useState<DashboardListing[]>([]);
  const [stats, setStats] = useState<StatsResponse>({
    pendingCount: 0,
    approvedToday: 0,
    rejectedToday: 0,
    approvalRate: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"dateDesc" | "dateAsc" | "status">("dateDesc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    const agent = getAgentContext();
    setError("");

    try {
      const [dashboardRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/agent/${agent.id}/dashboard`, {
          headers: getAuthHeaders(
            agent.assignedRegions.length
              ? { "x-assigned-regions": JSON.stringify(agent.assignedRegions) }
              : {}
          ),
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/agent/${agent.id}/stats`, {
          headers: getAuthHeaders(
            agent.assignedRegions.length
              ? { "x-assigned-regions": JSON.stringify(agent.assignedRegions) }
              : {}
          ),
          cache: "no-store",
        }),
      ]);

      if (!dashboardRes.ok || !statsRes.ok) {
        throw new Error("Failed to load dashboard");
      }

      const dashboardPayload = (await dashboardRes.json()) as DashboardResponse;
      const statsPayload = (await statsRes.json()) as StatsResponse;

      setItems(dashboardPayload.data || []);
      setStats(statsPayload);
    } catch {
      setError("Failed to load agent dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useInterval(loadDashboard, 120000);

  const filteredAndSortedItems = useMemo(() => {
    const filtered = items.filter((item) =>
      item.produceName.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    return filtered.sort((a, b) => {
      if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      }

      const aDate = new Date(a.harvestDate || 0).getTime();
      const bDate = new Date(b.harvestDate || 0).getTime();
      return sortBy === "dateDesc" ? bDate - aDate : aDate - bDate;
    });
  }, [items, searchTerm, sortBy]);

  // Get first assigned region for region-targeted announcements
  const regions = getAssignedRegions() as any[];
  const firstRegion = regions?.[0] ?? null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <AnnouncementBanner
        role="agent"
        district={firstRegion?.district ?? ""}
        upazila={firstRegion?.upazila ?? ""}
      />

      <div className="agri-hero flex items-start justify-between gap-4">
        <div>
          <h1 className="agri-page-title">Regional Monitoring</h1>
          <p className="agri-page-subtitle">
            Listings and verification KPIs for your assigned upazilas.
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="agri-alert agri-alert-error">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Pending Queue"
          value={stats.pendingCount}
          icon={ListTodo}
          accent="bg-amber-100 text-amber-700"
        />
        <MetricCard
          label="Approved Today"
          value={stats.approvedToday}
          icon={CheckCircle2}
          accent="bg-emerald-100 text-emerald-700"
        />
        <MetricCard
          label="Rejected Today"
          value={stats.rejectedToday}
          icon={XCircle}
          accent="bg-red-100 text-red-700"
        />
        <MetricCard
          label="Approval Rate (30d)"
          value={`${stats.approvalRate}%`}
          icon={TrendingUp}
          accent="bg-blue-100 text-blue-700"
        />
      </div>

      <section aria-label="Recent listings" className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent Regional Listings
        </h2>
        
        {/* Filters */}
        <Card className="agri-card p-5 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="agri-label">Search by produce name</label>
            <input
              className="agri-input"
              placeholder="e.g., rice, tomato"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64 shrink-0">
            <label className="agri-label">Sort</label>
            <select
              className="agri-select"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "dateDesc" | "dateAsc" | "status")
              }
            >
              <option value="dateDesc">Harvest date (newest)</option>
              <option value="dateAsc">Harvest date (oldest)</option>
              <option value="status">Status</option>
            </select>
          </div>
        </Card>

        {loading ? (
          <div className="agri-card p-8">
            <div className="agri-skeleton h-40 w-full" />
          </div>
        ) : (
          <div className="agri-table-wrapper">
            <table className="agri-table">
              <thead>
                <tr>
                  <th>Thumbnail</th>
                  <th>Produce</th>
                  <th>Farmer</th>
                  <th>Harvest Date</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedItems.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-muted-foreground" colSpan={7}>
                      No listings found for your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.imageUrl ? (
                          <img
                            src={`${API_BASE}/${item.imageUrl}`}
                            alt={item.produceName}
                            className="h-10 w-10 rounded-md object-cover border border-border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </td>
                      <td className="font-semibold text-[var(--agri-green-900)]">{item.produceName}</td>
                      <td>{item.farmerName}</td>
                      <td className="whitespace-nowrap">
                        {item.harvestDate
                          ? new Date(item.harvestDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        {typeof item.price === "number" ? `৳${item.price}` : "—"}
                      </td>
                      <td>
                        <span className={statusBadgeClass(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <Link href={`/agent/verify/${item.id}`}>
                          <button className="agri-btn-outline px-3 py-1.5 text-xs">
                            Verify
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
