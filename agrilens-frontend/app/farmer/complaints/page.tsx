"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchMyComplaints,
  updateComplaint,
  type Complaint,
  type ComplaintStatus,
} from "@/lib/complaints";

const STATUS_LABEL: Record<ComplaintStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const STATUS_BADGE: Record<ComplaintStatus, string> = {
  pending: "agri-badge-pending",
  under_review: "agri-badge-info",
  resolved: "agri-badge-approved",
  dismissed: "agri-badge-rejected",
};

function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`agri-badge ${STATUS_BADGE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function StatusTimeline({ status }: { status: ComplaintStatus }) {
  const isTerminal = status === "resolved" || status === "dismissed";
  const timelineSteps: ComplaintStatus[] = isTerminal
    ? ["pending", "under_review", status]
    : ["pending", "under_review", "resolved"];

  const activeIdx = timelineSteps.indexOf(
    isTerminal ? status : status === "under_review" ? "under_review" : "pending"
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "16px", marginBottom: "16px" }}>
      {timelineSteps.map((s, i) => {
        const done = i <= activeIdx;
        const isLast = i === timelineSteps.length - 1;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div
                style={{
                  width: "24px", height: "24px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s ease",
                  background: done ? (s === "dismissed" ? "#78716c" : "#16a34a") : "#e7e5e4"
                }}
              >
                {done && (
                  <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: "0.65rem", color: "#78716c", marginTop: "4px", whiteSpace: "nowrap", fontWeight: 600 }}>
                {STATUS_LABEL[s]}
              </span>
            </div>
            {!isLast && (
              <div
                style={{
                  height: "3px", flex: 1, borderRadius: "2px",
                  transition: "background 0.2s ease", marginBottom: "14px",
                  background: i < activeIdx ? "#22c55e" : "#e7e5e4"
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type EditState = { subject: string; description: string };

function EditForm({
  initial, complaintId, onSaved, onCancel,
}: {
  initial: EditState; complaintId: string; onSaved: (c: Complaint) => void; onCancel: () => void;
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
    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f5f5f4", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div className="agri-field">
        <label className="agri-label">Subject</label>
        <input
          value={form.subject}
          maxLength={120}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          style={{ height: "40px", borderRadius: "8px", border: "1px solid #bbf7d0", padding: "0 12px" }}
        />
      </div>
      <div className="agri-field">
        <label className="agri-label">Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ borderRadius: "8px", border: "1px solid #bbf7d0", padding: "12px", minHeight: "80px", resize: "vertical" }}
        />
      </div>
      {error && <p style={{ fontSize: "0.75rem", color: "#dc2626", background: "#fef2f2", padding: "6px 10px", borderRadius: "6px" }}>{error}</p>}
      <div style={{ display: "flex", gap: "8px" }}>
        <button className="agri-btn-primary" onClick={handleSave} disabled={saving} style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button className="agri-btn-outline" onClick={onCancel} disabled={saving} style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

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
    return (
      <div className="agri-page">
        <div className="agri-skeleton" style={{ height: "120px", marginBottom: "16px" }} />
        <div className="agri-skeleton" style={{ height: "120px" }} />
      </div>
    );
  }

  return (
    <div className="agri-page space-y-6">
      <div className="agri-page-header flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <h1 className="agri-page-title">My Complaints</h1>
          <p className="agri-page-subtitle">Track issues reported to agents</p>
        </div>
        <div className="flex gap-2">
          <Link href="/farmer/complaints/file" className="agri-btn-primary" style={{ textDecoration: "none" }}>+ New Complaint</Link>
          <Link href="/farmer" className="agri-btn-outline" style={{ textDecoration: "none" }}>Dashboard</Link>
        </div>
      </div>

      {fetchError && (
        <div style={{ padding: "12px 16px", borderRadius: "12px", background: "#fef2f2", border: "1.5px solid #fecaca", color: "#b91c1c", fontSize: "0.85rem" }}>
          {fetchError}
        </div>
      )}

      {!fetchError && complaints.length === 0 && (
        <div className="agri-empty">
          <div className="agri-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14h18"/><path d="M12 2v20"/><path d="M3 7h18"/><path d="M3 21h18"/></svg>
          </div>
          <h3 className="agri-empty-title">No complaints filed</h3>
          <p className="agri-empty-text">You haven&apos;t reported any issues yet.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {complaints.map((c) => {
          const isEditing = editingId === c._id;
          const canEdit = c.status === "pending";
          const agentName = c.agent?.fullName || c.agentId;

          return (
            <div key={c._id} className="agri-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1c1917", margin: 0 }}>{c.subject}</h2>
                    <StatusBadge status={c.status} />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#a8a29e", margin: 0 }}>
                    Assigned Agent: <strong style={{ color: "#78716c" }}>{agentName}</strong>
                    {c.agent?.email && ` · ${c.agent.email}`}
                  </p>
                </div>
                {canEdit && !isEditing && (
                  <button onClick={() => setEditingId(c._id)} className="agri-btn-outline" style={{ padding: "6px 14px", fontSize: "0.8rem", flexShrink: 0 }}>
                    Edit
                  </button>
                )}
              </div>

              <StatusTimeline status={c.status} />

              {!isEditing && (
                <p style={{ fontSize: "0.9rem", color: "#44403c", lineHeight: 1.6, margin: "0 0 12px 0" }}>
                  {c.description}
                </p>
              )}

              {c.evidenceUrls.length > 0 && !isEditing && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  {c.evidenceUrls.map((url, i) => (
                    <a
                      key={i}
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}/${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: "9999px", textDecoration: "none" }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      Evidence {i + 1}
                    </a>
                  ))}
                </div>
              )}

              {c.adminResponse && !isEditing && (
                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", padding: "12px 16px", marginTop: "12px" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0369a1", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Admin Response</p>
                  <p style={{ fontSize: "0.85rem", color: "#075985", margin: 0 }}>{c.adminResponse}</p>
                </div>
              )}

              {!isEditing && (
                <div style={{ fontSize: "0.75rem", color: "#a8a29e", marginTop: "12px" }}>
                  Filed on {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              )}

              {isEditing && (
                <EditForm
                  initial={{ subject: c.subject, description: c.description }}
                  complaintId={c._id}
                  onSaved={handleSaved}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
