"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { getAssignedRegions, getAuthHeaders, getCurrentUserId } from "@/lib/auth";
import { Calendar, PackageOpen, CheckCircle2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type QueueListing = {
  _id: string;
  cropType: string;
  quantity: number;
  unit: string;
  expectedHarvestDate?: string;
  createdAt?: string;
  photos?: string[];
  farmerId: string;
};

type QueueResponse = {
  data: QueueListing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function getAgentContext() {
  const id = getCurrentUserId();
  const assignedRegions = getAssignedRegions();
  return { id, assignedRegions };
}

export default function AgentQueuePage() {
  const [items, setItems] = useState<QueueListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [produceFilter, setProduceFilter] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const limit = 10;

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      setError("");
      try {
        const agent = getAgentContext();
        const res = await fetch(
          `${API_BASE}/api/agent/${agent.id}/queue?page=${page}&limit=${limit}`,
          {
            headers: getAuthHeaders(
              agent.assignedRegions.length
                ? { "x-assigned-regions": JSON.stringify(agent.assignedRegions) }
                : {}
            ),
          }
        );

        if (!res.ok) {
          throw new Error("Failed to load pending queue");
        }

        const payload = (await res.json()) as QueueResponse;
        setItems(payload.data || []);
        setTotalPages(payload.pagination?.totalPages || 1);
      } catch (err) {
        setError("Failed to load pending queue.");
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [page]);

  const filteredAndSorted = useMemo(() => {
    const filtered = items.filter((item) =>
      item.cropType.toLowerCase().includes(produceFilter.toLowerCase().trim())
    );

    return filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return sortBy === "newest" ? bDate - aDate : aDate - bDate;
    });
  }, [items, produceFilter, sortBy]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="agri-hero flex items-start justify-between gap-4">
        <div>
          <h1 className="agri-page-title">Pending Queue</h1>
          <p className="agri-page-subtitle">
            Review pending listings in your assigned regions.
          </p>
        </div>
      </div>

      <Card className="agri-card p-5 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="agri-label">Filter by produce type</label>
          <input
            value={produceFilter}
            onChange={(e) => setProduceFilter(e.target.value)}
            placeholder="e.g., rice, tomato"
            className="agri-input"
          />
        </div>
        <div className="w-full md:w-64 shrink-0">
          <label className="agri-label">Sort by date</label>
          <select
            className="agri-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </Card>

      {loading && (
        <div className="agri-card p-8">
          <div className="agri-skeleton h-40 w-full" />
        </div>
      )}
      {error && (
        <div role="alert" className="agri-alert agri-alert-error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {filteredAndSorted.map((item) => (
            <Card key={item._id} className="agri-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-[var(--agri-green-50)] text-[var(--agri-green-700)] flex items-center justify-center shrink-0">
                  <PackageOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--agri-green-900)]">{item.cropType}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {item.quantity} {item.unit}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Harvest:{" "}
                      {item.expectedHarvestDate
                        ? new Date(item.expectedHarvestDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="agri-badge bg-blue-100 text-blue-700 border-blue-200">
                      Farmer ID: {item.farmerId.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-auto">
                <Link href={`/agent/verify/${item._id}`}>
                  <button className="agri-btn-primary w-full md:w-auto">Review Listing</button>
                </Link>
              </div>
            </Card>
          ))}

          {filteredAndSorted.length === 0 && (
            <div className="agri-empty">
              <div className="agri-empty-icon">
                <CheckCircle2 className="h-6 w-6 text-[var(--agri-green-600)]" />
              </div>
              <h3 className="agri-empty-title">Queue is empty</h3>
              <p className="agri-empty-text">There are no pending listings matching your filters.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
        <button
          className="agri-btn-outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Previous
        </button>
        <div className="text-sm font-medium text-muted-foreground">
          Page {page} of {Math.max(1, totalPages)}
        </div>
        <button
          className="agri-btn-outline"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
