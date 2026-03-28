const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export function getAdminHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {
      "Content-Type": "application/json",
      "x-user-id": "admin-user",
      "x-user-role": "admin",
    };
  }
  const userId = window.localStorage.getItem("userId") || "admin-user";
  return {
    "Content-Type": "application/json",
    "x-user-id": userId,
    "x-user-role": "admin",
  };
}

export { API_BASE };
