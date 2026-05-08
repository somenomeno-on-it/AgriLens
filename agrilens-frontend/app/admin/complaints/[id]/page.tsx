"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_BASE, getAdminHeaders } from "@/lib/adminApi";

type Complaint = {
  _id: string;
  farmerId: string;
  agentId: string;
  subject: string;
  description: string;
  evidenceUrls: string[];
  status: "pending" | "under_review" | "resolved" | "dismissed";
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  agent?: { userId: string; fullName?: string; email?: string } | null;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function isPdf(path: string) {
  return path.toLowerCase().endsWith(".pdf");
}

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [response, setResponse] = useState("");
  const [finalStatus, setFinalStatus] = useState<"resolved" | "dismissed">("resolved");
  const [saving, setSaving] = useState(false);

  const evidence = useMemo(() => complaint?.evidenceUrls || [], [complaint?.evidenceUrls]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      // Use inbox endpoint to find this complaint by id (keeps backend minimal).
      const res = await fetch(`${API_BASE}/api/admin/complaints?page=1&limit=1&sort=newest`, {
        headers: getAdminHeaders(),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load complaints");
      // Fetch direct by filtering in-memory isn't possible with paging, so instead call with status/agentId not known.
      // We fall back to a dedicated fetch by id via the same endpoint using a large page size.
    } catch {
      // ignore; handled below with the real fetch
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/complaints?page=1&limit=100&sort=newest`, {
        headers: getAdminHeaders(),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load complaint");
      const json = await res.json();
      const found = (json.data || []).find((c: Complaint) => c._id === id);
      if (!found) {
        setError("Complaint not found (try adjusting inbox filters).");
        setComplaint(null);
      } else {
        setComplaint(found);
        setResponse(found.adminResponse || "");
      }
    } catch {
      setError("Failed to load complaint.");
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const markUnderReview = async () => {
    if (!id) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/complaints/${id}/status`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: "under_review" }),
      });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch {
      setError("Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const submitResponse = async () => {
    if (!id) return;
    if (!response.trim()) {
      setError("Admin response is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/complaints/${id}/respond`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ adminResponse: response, status: finalStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { message?: string }).message || "Failed to respond");
        return;
      }
      router.push("/admin/complaints");
    } catch {
      setError("Failed to submit response.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="agri-page-title">Complaint detail</h1>
          <p className="agri-page-subtitle">
            Review evidence and respond to the farmer.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/complaints">Back</Link>
        </Button>
      </div>

      {error && <div className="agri-alert agri-alert-error">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground">Loading...</div>}

      {!loading && complaint && (
        <>
          <Card className="agri-card p-5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{complaint.subject}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Created: {formatDate(complaint.createdAt)} • Updated: {formatDate(complaint.updatedAt)}
                </div>
              </div>
              <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium">
                {complaint.status}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 mt-3">
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">Farmer</div>
                <div className="text-sm mt-1">{complaint.farmerId}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">Agent</div>
                <div className="text-sm mt-1">
                  {complaint.agent?.fullName || complaint.agentId}{" "}
                  <span className="text-xs text-muted-foreground">({complaint.agentId})</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="agri-card p-5 space-y-3">
            <div className="text-sm font-semibold">Description</div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
          </Card>

          <Card className="agri-card p-5 space-y-3">
            <div className="text-sm font-semibold">Evidence</div>
            {evidence.length === 0 && (
              <div className="text-sm text-muted-foreground">No evidence attached.</div>
            )}
            {evidence.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {evidence.map((p) => {
                  const url = `${API_BASE}/${p}`;
                  return (
                    <div key={p} className="rounded-md border p-3 space-y-2">
                      <div className="text-xs text-muted-foreground break-all">{p}</div>
                      {isPdf(p) ? (
                        <a className="text-sm underline" href={url} target="_blank" rel="noreferrer">
                          Open PDF
                        </a>
                      ) : (
                        <img src={url} alt="Evidence" className="w-full h-44 object-cover rounded" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="agri-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Admin response</div>
              {(complaint.status === "pending" || complaint.status === "under_review") && (
                <Button variant="outline" onClick={markUnderReview} disabled={saving}>
                  Mark under review
                </Button>
              )}
            </div>

            <textarea
              className="w-full min-h-[140px] rounded-md border border-[var(--agri-green-200)] p-2 text-sm"
              placeholder="Write your response to the farmer…"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              disabled={saving}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">Final status</label>
                <select
                  className="agri-select"
                  value={finalStatus}
                  onChange={(e) => setFinalStatus(e.target.value as "resolved" | "dismissed")}
                  disabled={saving}
                >
                  <option value="resolved">resolved</option>
                  <option value="dismissed">dismissed</option>
                </select>
              </div>
              <Button onClick={submitResponse} disabled={saving || !response.trim()}>
                {saving ? "Saving…" : "Send response"}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

