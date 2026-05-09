"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getAssignedRegions, getAuthHeaders, getCurrentUserId } from "@/lib/auth";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type Listing = {
  _id: string;
  cropType: string;
  description?: string;
  expectedHarvestDate?: string;
  quantity: number;
  unit: string;
  farmerId: string;
  photos?: string[];
};

function getAgentContext() {
  const id = getCurrentUserId();
  const assignedRegions = getAssignedRegions();
  return { id, assignedRegions };
}

function getPhotoUrl(photoPath: string | null | undefined): string {
  if (!photoPath) return "";
  if (photoPath.startsWith("http")) return photoPath;
  const normalizedPath = photoPath.replace(/\\/g, "/");
  const cleanPath = normalizedPath.startsWith("/") ? normalizedPath.slice(1) : normalizedPath;
  const cleanBase = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  return `${cleanBase}/${cleanPath}`;
}

function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  return (
    <div className={`agri-toast ${type === "success" ? "agri-toast-success" : "agri-toast-error"}`}>
      <div className="flex items-center gap-2">
        {type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function AgentVerifyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = params?.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [grade, setGrade] = useState(75);
  const [feedback, setFeedback] = useState("");
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | "flag" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flagReason, setFlagReason] = useState("");

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    if (!listingId) return;

    const fetchListingFromQueue = async () => {
      setLoading(true);
      setError("");
      try {
        const agent = getAgentContext();
        const res = await fetch(`${API_BASE}/api/agent/${agent.id}/queue?page=1&limit=100`, {
          headers: getAuthHeaders(
            agent.assignedRegions.length
              ? { "x-assigned-regions": JSON.stringify(agent.assignedRegions) }
              : {}
          ),
        });

        if (!res.ok) throw new Error("Failed to load listing");
        const payload = await res.json();
        const found = (payload.data || []).find((item: Listing) => item._id === listingId);

        if (!found) {
          setError("Listing not found in your pending queue.");
        } else {
          setListing(found);
        }
      } catch (err) {
        setError("Failed to load listing details.");
      } finally {
        setLoading(false);
      }
    };

    fetchListingFromQueue();
  }, [listingId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const photos = useMemo(() => listing?.photos || [], [listing?.photos]);
  const activePhoto = photos[activePhotoIndex] || null;

  const submitVerification = async () => {
    if (!pendingAction || !listingId) return;
    setSubmitting(true);
    try {
      const agent = getAgentContext();
      const res = await fetch(`${API_BASE}/api/listings/${listingId}/verify`, {
        method: "PATCH",
        headers: getAuthHeaders(
          agent.assignedRegions.length
            ? { "x-assigned-regions": JSON.stringify(agent.assignedRegions) }
            : {}
        ),
        body: JSON.stringify({
          action: pendingAction,
          grade,
          feedback,
        }),
      });

      if (!res.ok) {
        throw new Error("Verification failed");
      }

      setToast({ type: "success", message: `Listing ${pendingAction} successfully.` });
      setPendingAction(null);
      router.push("/agent/queue");
    } catch (err) {
      setToast({ type: "error", message: "Failed to submit verification." });
      setPendingAction(null);
    } finally {
      setSubmitting(false);
    }
  };

  const submitFlag = async () => {
    if (!listingId || !flagReason.trim()) return;
    setSubmitting(true);
    try {
      const agent = getAgentContext();
      const res = await fetch(`${API_BASE}/api/listings/${listingId}/flag`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(
            agent.assignedRegions.length
              ? { "x-assigned-regions": JSON.stringify(agent.assignedRegions) }
              : {}
          ),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ flagReason }),
      });

      if (!res.ok) {
        throw new Error("Flagging failed");
      }

      setToast({ type: "success", message: "Listing flagged for review." });
      setPendingAction(null);
      router.push("/agent/queue");
    } catch (err) {
      setToast({ type: "error", message: "Failed to flag listing." });
      setPendingAction(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex items-center gap-4 mb-6">
        <Link href="/agent/queue" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="agri-page-title">Agent Verify Listing</h1>
      </div>

      {loading && (
        <div className="space-y-6">
          <div className="agri-skeleton h-48 w-full" />
          <div className="agri-skeleton h-64 w-full" />
        </div>
      )}
      {error && (
        <div role="alert" className="agri-alert agri-alert-error">
          {error}
        </div>
      )}

      {!loading && listing && (
        <>
          <div className="agri-section space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--agri-green-900)]">{listing.cropType}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="agri-badge bg-blue-100 text-blue-700 border-blue-200">
                    Farmer ID: {listing.farmerId.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    {listing.quantity} {listing.unit}
                  </span>
                </div>
              </div>
              <div className="text-sm bg-muted/50 rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">Expected Harvest:</span>{" "}
                <span className="text-muted-foreground">
                  {listing.expectedHarvestDate
                    ? new Date(listing.expectedHarvestDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>

            {listing.description && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-amber-900 leading-relaxed">{listing.description}</p>
              </div>
            )}

            {photos.length > 0 && (
              <div className="space-y-4">
                <h3 className="agri-section-title">Listing Photos</h3>
                <div className="rounded-xl overflow-hidden border border-border bg-muted/30 relative group">
                  <img
                    src={getPhotoUrl(activePhoto)}
                    alt="Listing preview"
                    className="h-96 w-full object-contain"
                  />
                  {photos.length > 1 && (
                    <>
                      <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm text-foreground transition-all opacity-0 group-hover:opacity-100"
                        onClick={() => setActivePhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm text-foreground transition-all opacity-0 group-hover:opacity-100"
                        onClick={() => setActivePhotoIndex((i) => (i + 1) % photos.length)}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                {photos.length > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        className={`h-2 rounded-full transition-all ${
                          i === activePhotoIndex ? "w-6 bg-[var(--agri-green-500)]" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        }`}
                        onClick={() => setActivePhotoIndex(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="agri-section space-y-6">
            <h3 className="agri-section-title">Verification Assessment</h3>
            
            <div className="p-5 rounded-xl border border-[var(--agri-green-100)] bg-[var(--agri-green-50)]/50 space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-[var(--agri-green-900)]">Produce Quality Grade</label>
                <span className="text-xl font-bold text-[var(--agri-green-700)]">{grade}%</span>
              </div>
              <input
                className="agri-range"
                type="range"
                min={0}
                max={100}
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-[var(--agri-green-700)] font-medium">
                <span>Poor (0)</span>
                <span>Excellent (100)</span>
              </div>
            </div>

            <div>
              <label className="agri-label">Agent Feedback</label>
              <textarea
                className="agri-input min-h-[120px] py-3 resize-y"
                placeholder="Write detailed assessment feedback for the farmer..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-border">
              <button
                className="agri-btn-danger w-full sm:w-auto"
                onClick={() => setPendingAction("flag")}
                disabled={submitting}
              >
                Flag for Admin Review
              </button>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  className="agri-btn-outline w-full sm:w-auto"
                  onClick={() => setPendingAction("rejected")}
                  disabled={submitting}
                >
                  Reject Listing
                </button>
                <button 
                  className="agri-btn-primary w-full sm:w-auto" 
                  onClick={() => setPendingAction("approved")} 
                  disabled={submitting}
                >
                  Approve Listing
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Flag Modal */}
      {pendingAction === "flag" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md agri-card p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive mb-2">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-xl font-bold">Flag for Review</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This will send the listing to the admin moderation queue. Please provide a detailed reason.
            </p>
            <textarea
              className="agri-input min-h-[120px] py-3 resize-y"
              placeholder="Reason for flagging..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
              <button className="agri-btn-outline" onClick={() => setPendingAction(null)} disabled={submitting}>
                Cancel
              </button>
              <button className="agri-btn-danger" onClick={submitFlag} disabled={submitting || !flagReason.trim()}>
                {submitting ? "Flagging..." : "Confirm Flag"}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {(pendingAction === "approved" || pendingAction === "rejected") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md agri-card p-6 space-y-4">
            <div className={`flex items-center gap-3 mb-2 ${pendingAction === "approved" ? "text-emerald-600" : "text-destructive"}`}>
              {pendingAction === "approved" ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              <h3 className="text-xl font-bold">
                Confirm {pendingAction === "approved" ? "Approval" : "Rejection"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to {pendingAction} this listing? This action cannot be easily undone.
            </p>
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <div className="text-sm font-semibold">Assigned Grade: {grade}%</div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
              <button className="agri-btn-outline" onClick={() => setPendingAction(null)} disabled={submitting}>
                Cancel
              </button>
              <button 
                className={pendingAction === "approved" ? "agri-btn-primary" : "agri-btn-danger"} 
                onClick={submitVerification} 
                disabled={submitting}
              >
                {submitting ? "Submitting..." : `Confirm ${pendingAction}`}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
