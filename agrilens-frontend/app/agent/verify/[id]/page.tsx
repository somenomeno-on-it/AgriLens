"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAssignedRegions, getAuthHeaders, getCurrentUserId } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

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

function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  return (
    <div
      className={`fixed right-4 top-4 z-50 rounded-md px-4 py-3 text-sm text-white shadow ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {message}
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agent Verify Listing</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/agent/queue">Back to Queue</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {loading && <div>Loading listing...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && listing && (
        <>
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{listing.cropType}</h2>
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Farmer: {listing.farmerId}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Quantity: {listing.quantity} {listing.unit}
            </div>
            <div className="text-sm text-muted-foreground">
              Harvest date:{" "}
              {listing.expectedHarvestDate
                ? new Date(listing.expectedHarvestDate).toLocaleDateString()
                : "N/A"}
            </div>
            {listing.description && (
              <p className="text-sm rounded-md border p-3 bg-muted/30">{listing.description}</p>
            )}

            {photos.length > 0 && (
              <div className="space-y-3">
                <div className="rounded-lg border p-2">
                  <img
                    src={`${API_BASE}/${activePhoto}`}
                    alt="Listing preview"
                    className="h-72 w-full object-cover rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setActivePhotoIndex((i) => (i - 1 + photos.length) % photos.length)
                    }
                  >
                    Prev
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    {activePhotoIndex + 1} / {photos.length}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setActivePhotoIndex((i) => (i + 1) % photos.length)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium">Grade: {grade}</label>
              <input
                className="mt-2 w-full"
                type="range"
                min={0}
                max={100}
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Feedback</label>
              <textarea
                className="mt-2 w-full min-h-[120px] rounded-md border p-2 text-sm"
                placeholder="Write agent feedback..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between mt-6">
              <Button
                variant="destructive"
                onClick={() => setPendingAction("flag")}
                disabled={submitting}
              >
                Flag for Admin Review
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPendingAction("rejected")}
                  disabled={submitting}
                >
                  Reject
                </Button>
                <Button onClick={() => setPendingAction("approved")} disabled={submitting}>
                  Approve
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {pendingAction === "flag" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-5 space-y-3">
            <h3 className="text-lg font-semibold text-destructive">Flag Listing for Review</h3>
            <p className="text-sm text-muted-foreground">
              This will send the listing to the admin moderation queue. Please provide a reason.
            </p>
            <textarea
              className="w-full min-h-[100px] border rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Reason for flagging..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setPendingAction(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={submitFlag} disabled={submitting || !flagReason.trim()}>
                {submitting ? "Flagging..." : "Confirm Flag"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {(pendingAction === "approved" || pendingAction === "rejected") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-5 space-y-3">
            <h3 className="text-lg font-semibold">Confirm {pendingAction}</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to {pendingAction} this listing?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingAction(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={submitVerification} disabled={submitting}>
                {submitting ? "Submitting..." : "Confirm"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
