import { getAuthHeaders } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type InventoryUpdateType = "sold" | "reserved";

export async function updateInventory(
  listingId: string,
  amount: number,
  type: InventoryUpdateType
) {
  const res = await fetch(`${API_BASE}/api/listings/${listingId}/inventory`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount, type }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to update inventory");
  }

  return res.json();
}

