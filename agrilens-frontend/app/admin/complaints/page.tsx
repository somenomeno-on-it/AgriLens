"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAdminHeaders } from "@/lib/adminApi";

type ComplaintRow = {
  _id: string;
  farmerId: string;
  agentId: string;
  subject: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  createdAt: string;
  agent?: { userId: string; fullName?: string; email?: string } | null;
};

type InboxResponse = {
  data: ComplaintRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function AdminComplaintsPage() {
  const [rows, setRows] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agentId, setAgentId] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const qs = useMemo(() => {
    const q = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
    });
    if (agentId.trim()) q.set("agentId", agentId.trim());
    if (status.trim()) q.set("status", status.trim());
    return q.toString();
  }, [agentId, status, page, limit, sort]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/complaints?${qs}`, {
        headers: getAdminHeaders(),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load complaints");
      const json = (await res.json()) as InboxResponse;
      setRows(json.data || []);
      setTotalPages(json.pagination?.totalPages ?? 1);
    } catch {
      setError("Failed to load complaints inbox.");
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [agentId, status, sort]);

  const markUnderReview = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/complaints/${id}/status`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: "under_review" }),
      });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch {
      setError("Failed to update complaint status.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Complaints inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review farmer complaints against agents and respond or update status.
        </p>
      </div>

      <Card className="p-4 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Filter by agentId</label>
          <Input
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="agent userId"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            className="mt-1 flex h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Sort</label>
          <select
            className="mt-1 flex h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </Card>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!loading && (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-3 font-medium">Farmer</th>
                <th className="p-3 font-medium">Agent</th>
                <th className="p-3 font-medium">Subject</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c._id} className="border-b">
                  <td className="p-3">{c.farmerId}</td>
                  <td className="p-3">
                    {c.agent?.fullName || c.agentId}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({c.agentId})
                    </span>
                  </td>
                  <td className="p-3">{c.subject}</td>
                  <td className="p-3">
                    <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium">
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" asChild>
                        <Link href={`/admin/complaints/${c._id}`}>View</Link>
                      </Button>
                      {c.status === "pending" && (
                        <Button
                          variant="outline"
                          onClick={() => markUnderReview(c._id)}
                        >
                          Under review
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No complaints found.</div>
          )}
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {page} of {Math.max(1, totalPages)}
        </div>
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

