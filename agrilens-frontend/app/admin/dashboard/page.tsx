"use client";

import { useCallback, useEffect, useState } from "react";
import { useInterval } from "@/hooks/useInterval";
import { Card } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Wheat,
  UserCheck,
  Activity,
} from "lucide-react";
import { getAdminHeaders } from "@/lib/adminApi";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
const REFRESH_INTERVAL_MS = 60_000; // 60 seconds

// ── Types ────────────────────────────────────────────────────────────────────

type ApprovedListing = {
  id: string;
  produceName: string;
  farmerName: string;
  approvedAt: string | null;
};

type LatestAgent = {
  name: string;
  email: string;
  district: string;
  bioUrl: string;
  createdAt: string;
};

type DashboardData = {
  activeUserCount: number;
  latestApprovedListings: ApprovedListing[];
  latestAgents: LatestAgent[];
};

type MetricsData = {
  totalListings: number;
  totalApproved: number;
  totalRejected: number;
  overallApprovalRate: number;
  activeFarmers: number;
  activeAgents: number;
};

// ── Skeleton component ────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      aria-hidden="true"
    />
  );
}

function MetricCardSkeleton() {
  return (
    <Card className="p-5 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </Card>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string; // tailwind bg class for the icon chip
};

function MetricCard({ label, value, icon: Icon, accent = "bg-primary/10 text-primary" }: MetricCardProps) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className={`rounded-lg p-2.5 shrink-0 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums truncate">{value}</p>
      </div>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [complaintAlert, setComplaintAlert] = useState<{
    threshold: number;
    flaggedCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setError("");
    const headers = getAdminHeaders();

    try {
      const [dashRes, metricsRes, complaintRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/dashboard`, { headers, cache: "no-store" }),
        fetch(`${API_BASE}/api/admin/metrics`, { headers, cache: "no-store" }),
        fetch(`${API_BASE}/api/admin/complaints/summary`, { headers, cache: "no-store" }),
      ]);

      if (!dashRes.ok || !metricsRes.ok) {
        throw new Error("One or more requests failed");
      }

      const [dashData, metricsData] = await Promise.all([
        dashRes.json() as Promise<DashboardData>,
        metricsRes.json() as Promise<MetricsData>,
      ]);

      setDashboard(dashData);
      setMetrics(metricsData);
      setLastRefreshed(new Date());

      if (complaintRes.ok) {
        const summary = await complaintRes.json();
        const threshold = summary?.threshold != null ? Number(summary.threshold) : 3;
        const flaggedAgentIds = Array.isArray(summary?.flaggedAgentIds)
          ? summary.flaggedAgentIds
          : [];
        const flaggedCount = flaggedAgentIds.length;
        setComplaintAlert(flaggedCount > 0 ? { threshold, flaggedCount } : null);
      } else {
        setComplaintAlert(null);
      }
    } catch {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-refresh every 60 seconds
  useInterval(fetchAll, REFRESH_INTERVAL_MS);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">System Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-wide overview — auto-refreshes every 60 seconds.
          </p>
        </div>
        <div className="text-right shrink-0">
          {lastRefreshed && (
            <p className="text-xs text-muted-foreground">
              Last updated:{" "}
              {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          <button
            onClick={fetchAll}
            className="mt-1 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Refresh now
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {complaintAlert && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <div className="font-semibold">Complaint threshold alert</div>
          <div className="mt-1">
            {complaintAlert.flaggedCount} agent(s) have reached the complaint threshold (≥{" "}
            {complaintAlert.threshold}). Check the complaints inbox.
          </div>
        </div>
      )}

      {/* ── Metrics Cards ──────────────────────────────────────────────────── */}
      <section aria-label="Platform metrics">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Platform Metrics
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard
              label="Total Listings"
              value={metrics.totalListings}
              icon={Wheat}
              accent="bg-amber-100 text-amber-700"
            />
            <MetricCard
              label="Approved"
              value={metrics.totalApproved}
              icon={CheckCircle2}
              accent="bg-emerald-100 text-emerald-700"
            />
            <MetricCard
              label="Rejected"
              value={metrics.totalRejected}
              icon={XCircle}
              accent="bg-red-100 text-red-700"
            />
            <MetricCard
              label="Approval Rate"
              value={`${metrics.overallApprovalRate}%`}
              icon={TrendingUp}
              accent="bg-blue-100 text-blue-700"
            />
            <MetricCard
              label="Active Farmers"
              value={metrics.activeFarmers}
              icon={Users}
              accent="bg-violet-100 text-violet-700"
            />
            <MetricCard
              label="Active Agents"
              value={metrics.activeAgents}
              icon={Activity}
              accent="bg-cyan-100 text-cyan-700"
            />
          </div>
        ) : null}
      </section>

      {/* ── Dashboard Data ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* Latest Approved Listings */}
        <section aria-label="Latest approved listings">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Latest Approved Listings
          </h2>
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Produce</th>
                    <th className="p-3 text-left font-medium">Farmer</th>
                    <th className="p-3 text-left font-medium whitespace-nowrap">Approved At</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard?.latestApprovedListings.length === 0 && (
                    <tr>
                      <td className="p-3 text-muted-foreground" colSpan={3}>
                        No approved listings yet.
                      </td>
                    </tr>
                  )}
                  {dashboard?.latestApprovedListings.map((listing) => (
                    <tr key={listing.id} className="border-t">
                      <td className="p-3 font-medium">{listing.produceName}</td>
                      <td className="p-3 text-muted-foreground">{listing.farmerName}</td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {listing.approvedAt
                          ? new Date(listing.approvedAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </section>

        {/* Latest Agents */}
        <section aria-label="Latest agents">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Latest Agents
          </h2>
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left font-medium">Name</th>
                      <th className="p-3 text-left font-medium">Email</th>
                      <th className="p-3 text-left font-medium">District</th>
                      <th className="p-3 text-left font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard?.latestAgents.length === 0 && (
                      <tr>
                        <td className="p-3 text-muted-foreground" colSpan={4}>
                          No agents found.
                        </td>
                      </tr>
                    )}
                    {dashboard?.latestAgents.map((agent, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3 font-medium">
                          {agent.name || <span className="text-muted-foreground italic">—</span>}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {agent.email ? (
                            <a
                              href={`mailto:${agent.email}`}
                              className="hover:underline"
                            >
                              {agent.email}
                            </a>
                          ) : (
                            <span className="italic">—</span>
                          )}
                        </td>
                        <td className="p-3 capitalize text-muted-foreground">
                          {agent.district || <span className="italic">—</span>}
                        </td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {agent.createdAt
                            ? new Date(agent.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* Active Users Summary Card */}
      {!loading && dashboard && (
        <section aria-label="Active users summary">
          <Card className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-indigo-100 p-3 text-indigo-700 shrink-0">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Users (last 24h)</p>
              <p className="text-3xl font-bold tabular-nums">
                {dashboard.activeUserCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Across all roles — farmers, agents, and admins combined.
              </p>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
