"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAdminHeaders } from "@/lib/adminApi";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
} from "recharts";

type FarmerDetail = {
  role: "farmer";
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    nationalId?: string;
    experienceYears?: number;
    createdAt: string;
    lastActive: string;
    isSuspended: boolean;
    verifiedBadge?: boolean;
    approvedListingCount?: number;
  };
  listingCount: number;
  approvalStats: {
    pending: number;
    approved: number;
    rejected: number;
    deleted: number;
    approvalRate: number;
  };
  complaints: Array<{
    id: string;
    subject?: string;
    body?: string;
    status: string;
    createdAt: string;
  }>;
};

type AgentDetail = {
  role: "agent";
  profile: {
    id: string;
    name: string;
    email: string;
    bioUrl?: string;
    assignedRegions: Array<{ district: string; upazila: string }>;
    createdAt: string;
    lastActive: string;
    isSuspended: boolean;
  };
  reviewStats: {
    totalReviews: number;
    approved: number;
    rejected: number;
    averageGrade: number | null;
    approvalRate: number;
  };
  reviews: Array<{
    id: string;
    listingId: unknown;
    action: string;
    grade?: number;
    feedback?: string;
    timestamp: string;
  }>;
};

type FarmerListingsResp = {
  breakdown: Record<string, number>;
  listings: Array<{
    id: string;
    cropType: string;
    status: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    verificationStatus?: string;
    createdAt: string;
  }>;
};

const PIE_COLORS = ["#16a34a", "#dc2626"];

function AdminUserDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const roleParam = (searchParams.get("role") || "farmer") as "farmer" | "agent";

  const [detail, setDetail] = useState<FarmerDetail | AgentDetail | null>(null);
  const [listings, setListings] = useState<FarmerListingsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => { //The function loads the user details from the backend (callback = uses the same load func)
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/users/${encodeURIComponent(id)}?role=${roleParam}`,
        { headers: getAdminHeaders(), cache: "no-store" }
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to load user");
      }
      const json = await res.json();
      setDetail(json);

      if (json.role === "farmer") {
        const lr = await fetch(
          `${API_BASE}/api/admin/farmers/${encodeURIComponent(id)}/listings`,
          { headers: getAdminHeaders(), cache: "no-store" }
        );
        if (lr.ok) setListings(await lr.json());
        else setListings(null);
      } else {
        setListings(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id, roleParam]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusPatch = async (status: "active" | "suspended") => { //The function handles the status patch
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/users/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH", //partially update a resource
          headers: getAdminHeaders(),
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("Update failed");
      setSuspendOpen(false);
      await load();
    } catch {
      alert("Could not update account status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") {
      alert('Type DELETE to confirm.');
      return;
    }
    if (!deleteReason.trim()) {
      alert('Please provide a reason for deletion.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/users/${encodeURIComponent(id)}?role=${roleParam}`,
        {
          method: "DELETE",
          headers: {
            ...getAdminHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: deleteReason }),
        }
      );
      if (!res.ok) throw new Error("Delete failed");
      window.location.href = "/admin/users";
    } catch {
      alert("Could not delete user.");
    } finally {
      setActionLoading(false);
      setDeleteOpen(false);
      setDeleteConfirm("");
      setDeleteReason("");
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading profile...</div>;
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error || "Not found"}</p>
        <Button asChild variant="outline">
          <Link href="/admin/users">Back to users</Link>
        </Button>
      </div>
    );
  }

  const pieData =
    detail.role === "agent"
      ? [
        { name: "Approved", value: (detail as AgentDetail).reviewStats.approved },
        { name: "Rejected", value: (detail as AgentDetail).reviewStats.rejected },
      ]
      : [];
  const pieSum = pieData.reduce((s, x) => s + x.value, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href="/admin/users">← Users</Link>
          </Button>
          <h1 className="agri-page-title">{detail.profile.name}</h1>
          <p className="agri-page-subtitle">
            {detail.role === "farmer" ? "Farmer" : "Agent"} · {detail.profile.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setSuspendOpen(true)}
            disabled={actionLoading}
          >
            {detail.profile.isSuspended ? "Unsuspend" : "Suspend"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={actionLoading}
          >
            Delete account
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="agri-card p-4 space-y-2">
          <h2 className="text-lg font-semibold">Profile</h2>
          <dl className="text-sm space-y-1">
            <div>
              <dt className="text-muted-foreground inline">Email: </dt>
              <dd className="inline">{detail.profile.email || "—"}</dd>
            </div>
            {detail.role === "farmer" && (
              <>
                <div>
                  <dt className="text-muted-foreground inline">Phone: </dt>
                  <dd className="inline">{(detail as FarmerDetail).profile.phone}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground inline">Address: </dt>
                  <dd className="inline">{(detail as FarmerDetail).profile.address}</dd>
                </div>
              </>
            )}
            {detail.role === "agent" && (
              <div>
                <dt className="text-muted-foreground">Regions</dt>
                <dd>
                  {(detail as AgentDetail).profile.assignedRegions?.length
                    ? (detail as AgentDetail).profile.assignedRegions
                      .map((r) => `${r.district}/${r.upazila}`)
                      .join(", ")
                    : "—"}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground inline">Status: </dt>
              <dd className="inline font-medium">
                {detail.profile.isSuspended ? (
                  <span className="text-amber-700">Suspended</span>
                ) : (
                  <span className="text-emerald-700">Active</span>
                )}
              </dd>
            </div>
            {detail.role === "farmer" && (detail as FarmerDetail).profile.verifiedBadge && (
              <div className="pt-1">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 11px",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                    color: "#fff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    boxShadow: "0 2px 8px rgba(22,163,74,0.30)",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Verified Farmer · {(detail as FarmerDetail).profile.approvedListingCount ?? 0} approved
                </span>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground inline">Last active: </dt>
              <dd className="inline">
                {new Date(detail.profile.lastActive).toLocaleString()}
              </dd>
            </div>
          </dl>
        </Card>

        {detail.role === "farmer" && (
          <Card className="agri-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">Listing & approval stats</h2>
            <p className="text-sm text-muted-foreground">
              Total listings:{" "}
              <span className="font-semibold text-foreground">
                {(detail as FarmerDetail).listingCount}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Stat label="Pending" value={(detail as FarmerDetail).approvalStats.pending} />
              <Stat label="Approved" value={(detail as FarmerDetail).approvalStats.approved} />
              <Stat label="Rejected" value={(detail as FarmerDetail).approvalStats.rejected} />
              <Stat label="Deleted" value={(detail as FarmerDetail).approvalStats.deleted} />
            </div>
            <p className="text-sm">
              Approval rate (approved vs rejected):{" "}
              <strong>{(detail as FarmerDetail).approvalStats.approvalRate}%</strong>
            </p>
          </Card>
        )}

        {detail.role === "agent" && (
          <Card className="agri-card p-4 space-y-2">
            <h2 className="text-lg font-semibold">Review stats</h2>
            <p className="text-sm">
              Total reviews: {(detail as AgentDetail).reviewStats.totalReviews} · Avg grade:{" "}
              {(detail as AgentDetail).reviewStats.averageGrade ?? "—"}
            </p>
            <div className="h-48">
              {pieSum === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No approved/rejected reviews yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Approval rate: {(detail as AgentDetail).reviewStats.approvalRate}%
            </p>
          </Card>
        )}
      </div>

      {detail.role === "farmer" && listings && (
        <Card className="agri-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">Listings</h2>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {Object.entries(listings.breakdown).map(([k, v]) => (
              <span key={k}>
                {k}: <strong className="text-foreground">{v}</strong>
              </span>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="agri-table text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Crop</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {listings.listings.map((l) => (
                  <tr key={l.id}>
                    <td className="p-2">{l.cropType}</td>
                    <td className="p-2 capitalize">{l.status}</td>
                    <td className="p-2">
                      {l.quantity} {l.unit}
                    </td>
                    <td className="p-2">{l.pricePerUnit}</td>
                    <td className="p-2 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {detail.role === "farmer" && (
        <Card className="agri-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">Complaint history</h2>
          {(detail as FarmerDetail).complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No complaints on file.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(detail as FarmerDetail).complaints.map((c) => (
                <li key={c.id} className="border border-[var(--agri-green-100)] rounded-md p-3 bg-white">
                  <div className="font-medium">{c.subject || "Complaint"}</div>
                  <div className="text-muted-foreground">{c.body}</div>
                  <div className="text-xs mt-1">
                    {c.status} · {new Date(c.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {detail.role === "agent" && (
        <Card className="agri-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">Recent reviews</h2>
          <div className="overflow-x-auto">
            <table className="agri-table text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">When</th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Grade</th>
                  <th className="p-2">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {(detail as AgentDetail).reviews.map((r) => (
                  <tr key={r.id}>
                    <td className="p-2 whitespace-nowrap">
                      {r.timestamp ? new Date(r.timestamp).toLocaleString() : "—"}
                    </td>
                    <td className="p-2 capitalize">{r.action}</td>
                    <td className="p-2">{r.grade ?? "—"}</td>
                    <td className="p-2 max-w-md truncate">{r.feedback || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {suspendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              {detail.profile.isSuspended ? "Activate account" : "Suspend account"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {detail.profile.isSuspended
                ? "This user will be able to sign in and use the platform again."
                : "The user will be marked suspended. Confirm to continue."}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSuspendOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleStatusPatch(detail.profile.isSuspended ? "active" : "suspended")
                }
                disabled={actionLoading}
              >
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-destructive">Delete account</h3>
            <p className="text-sm text-muted-foreground">
              This permanently removes the {detail.role} account. Farmer listings will be
              marked deleted; agent verification assignments will be cleared.
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Type DELETE to confirm
              </label>
              <Input
                className="mt-1 mb-3"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
              />
              <label className="text-xs font-medium text-muted-foreground mt-2">
                Reason for deletion (required)
              </label>
              <textarea
                className="w-full min-h-[80px] mt-1 p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Reason..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteConfirm("");
                  setDeleteReason("");
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                Delete permanently
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground p-6">Loading...</div>}>
      <AdminUserDetailInner />
    </Suspense>
  );
}
