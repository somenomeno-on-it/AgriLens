import { getAuthHeaders, getAuthToken } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export type ComplaintStatus =
  | "pending"
  | "under_review"
  | "resolved"
  | "dismissed";

export type AgentRef = {
  userId: string;
  fullName?: string;
  email?: string;
};

export type Complaint = {
  _id: string;
  farmerId: string;
  agentId: string;
  subject: string;
  description: string;
  evidenceUrls: string[];
  status: ComplaintStatus;
  adminResponse: string;
  createdAt: string;
  updatedAt: string;
  agent?: AgentRef | null;
};

export type Agent = {
  userId: string;
  fullName?: string;
  email?: string;
  assignedRegions?: { district: string; upazila: string }[];
};

// ---- Complaints ----

export async function fetchMyComplaints(): Promise<Complaint[]> {
  const res = await fetch(`${API_BASE}/api/complaints`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch complaints");
  return res.json();
}

export async function createComplaint(data: {
  agentId: string;
  subject: string;
  description: string;
}): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/api/complaints`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || "Failed to create complaint");
  }
  return res.json();
}

export async function updateComplaint(
  id: string,
  data: { subject?: string; description?: string }
): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/api/complaints/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || "Failed to update complaint");
  }
  return res.json();
}

export async function uploadComplaintEvidence(
  id: string,
  files: File[]
): Promise<{ evidenceUrls: string[] }> {
  const token = getAuthToken();
  const formData = new FormData();
  files.forEach((f) => formData.append("evidence", f));

  const res = await fetch(`${API_BASE}/api/complaints/${id}/evidence`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || "Failed to upload evidence");
  }
  return res.json();
}

// ---- Agents (for the selector) ----

export async function fetchAllAgents(): Promise<Agent[]> {
  const res = await fetch(`${API_BASE}/api/complaints/agents`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}
