"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAssignedRegions, getAuthHeaders, getCurrentUserId } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

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
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Produce Pending Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review pending listings in your assigned regions.
          </p>
        </div>
        <LogoutButton />
      </div>

      <Card className="p-4 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Filter by produce type</label>
          <Input
            value={produceFilter}
            onChange={(e) => setProduceFilter(e.target.value)}
            placeholder="e.g., rice, tomato"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Sort by date</label>
          <select
            className="mt-1 h-10 rounded-md border px-3 text-sm bg-background"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </Card>

      {loading && <div>Loading queue...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="space-y-3">
          {filteredAndSorted.map((item) => (
            <Card key={item._id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{item.cropType}</div>
                <div className="text-sm text-muted-foreground">
                  {item.quantity} {item.unit} • Harvest:{" "}
                  {item.expectedHarvestDate
                    ? new Date(item.expectedHarvestDate).toLocaleDateString()
                    : "N/A"}
                </div>
                <span className="inline-flex mt-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                  Farmer: {item.farmerId}
                </span>
              </div>
              <Button asChild>
                <Link href={`/agent/verify/${item._id}`}>Review</Link>
              </Button>
            </Card>
          ))}

          {filteredAndSorted.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No pending listings match this filter.
            </div>
          )}
        </div>
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
