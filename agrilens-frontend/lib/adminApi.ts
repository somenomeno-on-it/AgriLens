import { getAuthHeaders } from "@/lib/auth";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export function getAdminHeaders(): Record<string, string> {
  return getAuthHeaders();
}

export { API_BASE };
