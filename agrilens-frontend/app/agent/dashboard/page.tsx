"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInterval } from "@/hooks/useInterval";
import { getAssignedRegions, getAuthHeaders, getCurrentUserId } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

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
  if (status === "approved") return "bg-green-100 text-green-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Regional Monitoring Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Listings and verification KPIs for your assigned upazilas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/agent/queue">Open Queue</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pending</div>
          <div className="mt-1 text-2xl font-semibold">{stats.pendingCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Approved Today</div>
          <div className="mt-1 text-2xl font-semibold">{stats.approvedToday}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Rejected Today</div>
          <div className="mt-1 text-2xl font-semibold">{stats.rejectedToday}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Approval Rate (30d)</div>
          <div className="mt-1 text-2xl font-semibold">{stats.approvalRate}%</div>
        </Card>
      </div>

      <Card className="p-4 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Search by produce name</label>
          <Input
            className="mt-1"
            placeholder="e.g., rice, tomato"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Sort</label>
          <select
            className="mt-1 h-10 rounded-md border px-3 text-sm bg-background"
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

      {loading && <div>Loading dashboard...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Thumbnail</th>
                <th className="p-3 text-left font-medium">Produce</th>
                <th className="p-3 text-left font-medium">Farmer</th>
                <th className="p-3 text-left font-medium">Harvest Date</th>
                <th className="p-3 text-left font-medium">Price</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedItems.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">
                    {item.imageUrl ? (
                      <img
                        src={`${API_BASE}/${item.imageUrl}`}
                        alt={item.produceName}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted" />
                    )}
                  </td>
                  <td className="p-3 font-medium">{item.produceName}</td>
                  <td className="p-3">{item.farmerName}</td>
                  <td className="p-3">
                    {item.harvestDate
                      ? new Date(item.harvestDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-3">
                    {typeof item.price === "number" ? `${item.price}` : "N/A"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <Button asChild size="sm">
                      <Link href={`/agent/verify/${item.id}`}>Verify</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredAndSortedItems.length === 0 && (
                <tr className="border-t">
                  <td className="p-3 text-muted-foreground" colSpan={7}>
                    No listings found for your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
