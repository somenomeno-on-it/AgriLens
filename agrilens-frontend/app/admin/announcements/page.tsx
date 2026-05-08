"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminHeaders, API_BASE } from "@/lib/adminApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Megaphone, Plus, Trash2, Globe, Users, UserCheck, MapPin } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type TargetAudience = "all" | "farmers" | "agents" | "region";

type Announcement = {
  _id: string;
  title: string;
  body: string;
  targetAudience: TargetAudience;
  targetDistrict?: string | null;
  targetUpazila?: string | null;
  adminName: string;
  isActive: boolean;
  createdAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const AUDIENCE_LABELS: Record<TargetAudience, string> = {
  all: "Everyone",
  farmers: "Farmers only",
  agents: "Agents only",
  region: "Specific region",
};

const AUDIENCE_ICONS: Record<TargetAudience, React.ElementType> = {
  all: Globe,
  farmers: Users,
  agents: UserCheck,
  region: MapPin,
};

const AUDIENCE_COLORS: Record<TargetAudience, string> = {
  all: "bg-blue-100 text-blue-700",
  farmers: "bg-emerald-100 text-emerald-700",
  agents: "bg-violet-100 text-violet-700",
  region: "bg-amber-100 text-amber-700",
};

function AudienceBadge({ audience }: { audience: TargetAudience }) {
  const Icon = AUDIENCE_ICONS[audience];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${AUDIENCE_COLORS[audience]}`}
    >
      <Icon className="h-3 w-3" />
      {AUDIENCE_LABELS[audience]}
    </span>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formAudience, setFormAudience] = useState<TargetAudience>("all");
  const [formDistrict, setFormDistrict] = useState("");
  const [formUpazila, setFormUpazila] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements?limit=50`, {
        headers: getAdminHeaders(),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setAnnouncements(json.data || []);
    } catch {
      setError("Failed to load announcements. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async () => {
    setFormError("");
    if (!formTitle.trim()) { setFormError("Title is required."); return; }
    if (!formBody.trim()) { setFormError("Body is required."); return; }
    if (formAudience === "region" && (!formDistrict.trim() || !formUpazila.trim())) {
      setFormError("District and Upazila are required for region targeting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          title: formTitle.trim(),
          body: formBody.trim(),
          targetAudience: formAudience,
          targetDistrict: formAudience === "region" ? formDistrict.trim().toLowerCase() : undefined,
          targetUpazila: formAudience === "region" ? formUpazila.trim().toLowerCase() : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Failed to create");
      }
      const created: Announcement = await res.json();
      setAnnouncements((prev) => [created, ...prev]);
      setShowForm(false);
      setFormTitle("");
      setFormBody("");
      setFormAudience("all");
      setFormDistrict("");
      setFormUpazila("");
    } catch (err: any) {
      setFormError(err.message || "Failed to create announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this announcement? It will no longer be visible to users.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      if (!res.ok) throw new Error("Failed to deactivate");
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === id ? { ...a, isActive: false } : a))
      );
    } catch {
      alert("Failed to deactivate announcement.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="agri-hero flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Platform Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Broadcast messages to farmers, agents, or specific regions.
          </p>
        </div>
        <Button
          id="btn-new-announcement"
          onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <Card className="agri-card p-6 space-y-4 border-primary/30 border-2">
          <h2 className="text-base font-semibold">Create Announcement</h2>

          {formError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Title
            </label>
            <Input
              id="announcement-title"
              placeholder="e.g. System maintenance on April 25th"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={200}
              className="agri-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Message Body
            </label>
            <textarea
              id="announcement-body"
              className="w-full min-h-[120px] rounded-md border border-[var(--agri-green-200)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--agri-green-500)] resize-none"
              placeholder="Write the full announcement message here..."
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{formBody.length}/2000</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Target Audience
            </label>
            <div className="flex flex-wrap gap-2">
              {(["all", "farmers", "agents", "region"] as TargetAudience[]).map((aud) => {
                const Icon = AUDIENCE_ICONS[aud];
                return (
                  <button
                    key={aud}
                    id={`audience-${aud}`}
                    type="button"
                    onClick={() => setFormAudience(aud)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-all ${
                      formAudience === aud
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {AUDIENCE_LABELS[aud]}
                  </button>
                );
              })}
            </div>
          </div>

          {formAudience === "region" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-md bg-amber-50 border border-amber-200">
              <div className="space-y-1">
                <label className="text-xs font-medium text-amber-800">District</label>
                <Input
                  id="announcement-district"
                  placeholder="e.g. dhaka"
                  value={formDistrict}
                  onChange={(e) => setFormDistrict(e.target.value)}
                  className="agri-input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-amber-800">Upazila</label>
                <Input
                  id="announcement-upazila"
                  placeholder="e.g. savar"
                  value={formUpazila}
                  onChange={(e) => setFormUpazila(e.target.value)}
                  className="agri-input"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => { setShowForm(false); setFormError(""); }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button id="btn-submit-announcement" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Publishing..." : "Publish Announcement"}
            </Button>
          </div>
        </Card>
      )}

      {/* Announcements List */}
      <section aria-label="Announcement history">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          All Broadcasts ({announcements.length})
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </Card>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <Card className="agri-card p-8 text-center text-muted-foreground text-sm">
            No announcements yet. Create the first one above.
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <Card
                key={ann._id}
                className={`agri-card p-4 transition-opacity ${ann.isActive ? "" : "opacity-50"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm truncate">{ann.title}</h3>
                      {!ann.isActive && (
                        <span className="text-xs rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ann.body}</p>
                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      <AudienceBadge audience={ann.targetAudience} />
                      {ann.targetAudience === "region" && ann.targetDistrict && (
                        <span className="text-xs text-muted-foreground">
                          {ann.targetDistrict} › {ann.targetUpazila}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        by <strong>{ann.adminName}</strong>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ann.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {ann.isActive && (
                    <button
                      title="Deactivate announcement"
                      onClick={() => handleDeactivate(ann._id)}
                      className="shrink-0 p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
