"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
import { API_BASE, getAdminHeaders } from "@/lib/adminApi";

type AgentRow = { id: string; name: string; email: string };

type PerformancePayload = {
  totalReviews: number;
  avgGrade: number | null;
  approvalRate: number;
  rejectionRate: number;
  pendingQueueSize: number;
  reviewsLast30Days: { date: string; count: number }[];
};

export default function AgentPerformancePage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [agentId, setAgentId] = useState("");
  const [data, setData] = useState<PerformancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAgents = useCallback(async () => {
    const res = await fetch(
      `${API_BASE}/api/admin/users?role=agent&page=1&limit=200`,
      { headers: getAdminHeaders(), cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed to load agents");
    const json = await res.json();
    const rows: AgentRow[] = (json.data || []).map(
      (u: { id: string; name: string; email: string }) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      })
    );
    setAgents(rows);
    setAgentId((prev) => prev || (rows[0]?.id ?? ""));
  }, []);

  const loadPerformance = useCallback(async (id: string) => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/agents/${encodeURIComponent(id)}/performance`,
        { headers: getAdminHeaders(), cache: "no-store" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { message?: string }).message || "Failed to load");
      }
      const json = (await res.json()) as PerformancePayload;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load performance");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadAgents();
      } catch {
        setError("Could not load agents.");
        setLoading(false);
      }
    })();
  }, [loadAgents]);

  useEffect(() => {
    if (agentId) loadPerformance(agentId);
  }, [agentId, loadPerformance]);

  const chartData =
    data?.reviewsLast30Days?.map((d) => ({
      label: d.date.slice(5),
      value: d.count,
    })) ?? [];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agent performance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review volume, grades, and approval rates for the selected agent.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Agent</label>
        <select
          className="mt-1 flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
        >
          <option value="">Select agent</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || a.id} {a.email ? `(${a.email})` : ""}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading metrics…</p>}

      {data && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Total reviews</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{data.totalReviews}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Avg grade</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {data.avgGrade != null ? data.avgGrade : "—"}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Approval rate</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{data.approvalRate}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Pending queue</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{data.pendingQueueSize}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-sm font-semibold mb-4">Reviews over last 30 days</h2>
            <div className="w-full overflow-x-auto">
              <SimpleLineChart data={chartData} height={280} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Rejection rate: {data.rejectionRate}%
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
