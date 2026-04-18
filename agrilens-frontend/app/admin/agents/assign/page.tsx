"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_BASE, getAdminHeaders } from "@/lib/adminApi";
import {
  getDistrictOptions,
  getUpazilaOptionsForDistrict,
} from "@/src/data/bdRegions";

type AgentRow = { id: string; name: string; email: string };
type RegionChip = { district: string; upazila: string };
type WorkloadRow = {
  userId: string;
  fullName?: string;
  email?: string;
  pendingQueueSize: number;
  overThreshold: boolean;
};

export default function AdminAgentAssignPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [agentId, setAgentId] = useState("");
  const [regions, setRegions] = useState<RegionChip[]>([]);
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [workload, setWorkload] = useState<WorkloadRow[]>([]);
  const [threshold, setThreshold] = useState(50);
  const [workloadLoading, setWorkloadLoading] = useState(true);
  const [flaggedComplaintAgents, setFlaggedComplaintAgents] = useState<Set<string>>(
    new Set()
  );

  const districtOptions = useMemo(() => getDistrictOptions(), []);
  const upazilaOptions = useMemo(
    () => getUpazilaOptionsForDistrict(district),
    [district]
  );

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

  const loadRegions = useCallback(async (id: string) => {
    if (!id) {
      setRegions([]);
      return;
    }
    const res = await fetch(`${API_BASE}/api/admin/agents/${encodeURIComponent(id)}/regions`, {
      headers: getAdminHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to load regions");
    const json = await res.json();
    setRegions(json.assignedRegions || []);
  }, []);

  const loadWorkload = useCallback(async () => {
    setWorkloadLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/agents/workload`, {
        headers: getAdminHeaders(),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load workload");
      const json = await res.json();
      setThreshold(json.workloadThreshold ?? 50);
      const list: WorkloadRow[] = json.agents || [];
      list.sort((a, b) => b.pendingQueueSize - a.pendingQueueSize);
      setWorkload(list);
    } catch {
      setWorkload([]);
    } finally {
      setWorkloadLoading(false);
    }
  }, []);

  const loadComplaintFlags = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/complaints/summary`, {
        headers: getAdminHeaders(),
        cache: "no-store",
      });
      if (!res.ok) {
        setFlaggedComplaintAgents(new Set());
        return;
      }
      const json = await res.json();
      const ids = Array.isArray(json.flaggedAgentIds) ? json.flaggedAgentIds : [];
      setFlaggedComplaintAgents(new Set(ids.map((x: unknown) => String(x))));
    } catch {
      setFlaggedComplaintAgents(new Set());
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        await loadAgents();
      } catch {
        setError("Could not load agents.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAgents]);

  useEffect(() => {
    if (!agentId) return;
    (async () => {
      try {
        await loadRegions(agentId);
      } catch {
        setRegions([]);
      }
    })();
  }, [agentId, loadRegions]);

  useEffect(() => {
    loadWorkload();
  }, [loadWorkload]);

  useEffect(() => {
    loadComplaintFlags();
  }, [loadComplaintFlags]);

  useEffect(() => {
    setUpazila("");
  }, [district]);

  const handleAssign = async () => {
    if (!agentId || !district || !upazila) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/agents/${encodeURIComponent(agentId)}/assign-region`,
        {
          method: "POST",
          headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ district, upazila }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { message?: string }).message || "Assign failed");
        return;
      }
      setRegions(json.assignedRegions || []);
      setDistrict("");
      setUpazila("");
      loadWorkload();
      loadComplaintFlags();
    } catch {
      setError("Assign failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (districtVal: string, upazilaVal: string) => {
    if (!agentId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/agents/${encodeURIComponent(agentId)}/region`,
        {
          method: "DELETE",
          headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ district: districtVal, upazila: upazilaVal }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { message?: string }).message || "Remove failed");
        return;
      }
      setRegions(json.assignedRegions || []);
      loadWorkload();
      loadComplaintFlags();
    } catch {
      setError("Remove failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agent region assignment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assign districts and upazilas to verification agents. Current workload is listed
          below (red when above threshold).
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-semibold">Assign regions</h2>
        {loading && <p className="text-sm text-muted-foreground">Loading agents…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && (
          <>
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
                    {a.name || a.id} {a.email ? `(${a.email})` : ""}{" "}
                    {flaggedComplaintAgents.has(a.id) ? "[Flagged]" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Current assignments
              </label>
              <div className="mt-2 flex flex-wrap gap-2 min-h-[2rem]">
                {regions.length === 0 && (
                  <span className="text-sm text-muted-foreground">No regions yet.</span>
                )}
                {regions.map((r) => (
                  <span
                    key={`${r.district}-${r.upazila}`}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-xs"
                  >
                    <span className="capitalize">
                      {r.district} / {r.upazila}
                    </span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                      disabled={saving || !agentId}
                      onClick={() => handleRemove(r.district, r.upazila)}
                      aria-label="Remove region"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
              <div>
                <label className="text-xs font-medium text-muted-foreground">District</label>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <option value="">Choose district</option>
                  {districtOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Upazila</label>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  disabled={!district}
                >
                  <option value="">Choose upazila</option>
                  {upazilaOptions.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAssign}
              disabled={saving || !agentId || !district || !upazila}
            >
              {saving ? "Saving…" : "Add region"}
            </Button>
          </>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-semibold">Agent workload</h2>
          <span className="text-xs text-muted-foreground">
            Threshold: {threshold} pending listings
          </span>
        </div>
        {workloadLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!workloadLoading && (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-3 font-medium">Agent</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium text-right">Pending queue</th>
                </tr>
              </thead>
              <tbody>
                {workload.map((w) => (
                  <tr
                    key={w.userId}
                    className={
                      w.overThreshold
                        ? "bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900"
                        : "border-b"
                    }
                  >
                    <td className="p-3">{w.fullName || w.userId}</td>
                    <td className="p-3 text-muted-foreground">{w.email || "—"}</td>
                    <td className="p-3 text-right font-medium tabular-nums">
                      {w.pendingQueueSize}
                      {w.overThreshold && (
                        <span className="ml-2 text-xs font-semibold text-red-600">
                          Over threshold
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {workload.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No agents found.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
