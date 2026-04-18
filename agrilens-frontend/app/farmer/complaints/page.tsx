"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchMyComplaints,
  updateComplaint,
  type Complaint,
  type ComplaintStatus,
} from "@/lib/complaints";

// ---- Status config ----
const STATUS_STEPS: ComplaintStatus[] = [
  "pending",
  "under_review",
  "resolved",
  "dismissed",
];

const STATUS_LABEL: Record<ComplaintStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const STATUS_COLOR: Record<ComplaintStatus, string> = {
  pending:
    "bg-amber-100 text-amber-800 border border-amber-200",
  under_review:
    "bg-blue-100 text-blue-800 border border-blue-200",
  resolved:
    "bg-green-100 text-green-700 border border-green-200",
  dismissed:
    "bg-zinc-100 text-zinc-600 border border-zinc-200",
};

const STATUS_DOT: Record<ComplaintStatus, string> = {
  pending: "bg-amber-400",
  under_review: "bg-blue-500",
  resolved: "bg-green-500",
  dismissed: "bg-zinc-400",
};

function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

// ---- Timeline (Pending → Under Review → Resolved/Dismissed) ----
function StatusTimeline({ status }: { status: ComplaintStatus }) {
  const isTerminal = status === "resolved" || status === "dismissed";
  const timelineSteps: ComplaintStatus[] = isTerminal
    ? ["pending", "under_review", status]
    : ["pending", "under_review", "resolved"];

  const activeIdx = timelineSteps.indexOf(
    isTerminal ? status : status === "under_review" ? "under_review" : "pending"
  );

  return (
    <div className="flex items-center gap-1 mt-3">
      {timelineSteps.map((s, i) => {
        const done = i <= activeIdx;
        const isLast = i === timelineSteps.length - 1;
        return (
          <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  done
                    ? s === "dismissed"
                      ? "bg-zinc-400"
                      : "bg-green-600"
                    : "bg-zinc-200"
                }`}
              >
                {done && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 mt-0.5 whitespace-nowrap">
                {STATUS_LABEL[s]}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 flex-1 rounded transition-colors ${
                  i < activeIdx ? "bg-green-500" : "bg-zinc-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Inline edit form ----
type EditState = { subject: string; description: string };

function EditForm({
  initial,
  complaintId,
  onSaved,
  onCancel,
}: {
  initial: EditState;
  complaintId: string;
  onSaved: (c: Complaint) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EditState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!form.subject.trim()) { setError("Subject is required."); return; }
    if (!form.description.trim()) { setError("Description is required."); return; }
    setSaving(true);
    try {
      const updated = await updateComplaint(complaintId, form);
      onSaved(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 mt-3 pt-3 border-t border-zinc-100">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-zinc-600">Subject</label>
        <Input
          value={form.subject}
          maxLength={120}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-zinc-600">Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">{error}</p>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving} className="bg-green-700 hover:bg-green-800">
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ---- Main page ----
export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyComplaints()
      .then(setComplaints)
      .catch(() => setFetchError("Failed to load complaints."))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (updated: Complaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c))
    );
    setEditingId(null);
  };

  if (loading) {
    return <div className="p-6">Loading complaints...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Complaints</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/farmer/complaints/file">New Complaint</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/farmer">Dashboard</Link>
          </Button>
        </div>
      </div>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        )}

        {/* empty state */}
        {!fetchError && complaints.length === 0 && (
          <div className="text-sm text-zinc-500">
            You have no complaints filed yet.
          </div>
        )}

        {/* complaints list */}
        <div className="space-y-4">
          {complaints.map((c) => {
            const isEditing = editingId === c._id;
            const canEdit = c.status === "pending";
            const agentName = c.agent?.fullName || c.agentId;

            return (
              <Card
                key={c._id}
                className="p-5 space-y-2"
              >
                {/* top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-lg leading-tight">
                        {c.subject}
                      </h2>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Agent:{" "}
                      <span className="font-medium text-zinc-600">{agentName}</span>
                      {c.agent?.email && (
                        <span className="text-zinc-400"> · {c.agent.email}</span>
                      )}
                    </p>
                  </div>
                  {canEdit && !isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(c._id)}
                      className="shrink-0"
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {/* status timeline */}
                <StatusTimeline status={c.status} />

                {/* description */}
                {!isEditing && (
                  <p className="text-sm text-zinc-600 pt-1 leading-relaxed">
                    {c.description}
                  </p>
                )}

                {/* evidence urls */}
                {c.evidenceUrls.length > 0 && !isEditing && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {c.evidenceUrls.map((url, i) => (
                      <a
                        key={i}
                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}/${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5 hover:bg-green-100 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                        </svg>
                        Evidence {i + 1}
                      </a>
                    ))}
                  </div>
                )}

                {/* admin response */}
                {c.adminResponse && !isEditing && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 mt-1">
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">
                      Admin Response
                    </p>
                    <p className="text-sm text-blue-800">{c.adminResponse}</p>
                  </div>
                )}

                {/* date */}
                {!isEditing && (
                  <p className="text-[11px] text-zinc-400">
                    Filed{" "}
                    {new Date(c.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}

                {/* inline edit form */}
                {isEditing && (
                  <EditForm
                    initial={{ subject: c.subject, description: c.description }}
                    complaintId={c._id}
                    onSaved={handleSaved}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </Card>
            );
          })}
        </div>
    </div>
  );
}
