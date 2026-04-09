export type AuthRole = "farmer" | "agent" | "admin";

export type AuthSessionUser = {
  id: string;
  role: AuthRole;
  email?: string;
  fullName?: string;
  assignedRegions?: string[];
};

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";
const COOKIE_KEY = "authToken";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthSessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSessionUser;
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: AuthSessionUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  document.cookie = `${COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function isAuthenticated() {
  return !!getAuthToken() && !!getAuthUser();
}

export function getCurrentUserId() {
  return getAuthUser()?.id || "";
}

export function getCurrentUserRole() {
  return getAuthUser()?.role || null;
}

export function getAssignedRegions() {
  return getAuthUser()?.assignedRegions || [];
}

export function getAuthHeaders(extra: Record<string, string> = {}) {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}
