const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type InventoryUpdateType = "sold" | "reserved";

function getUserId() {
  if (typeof window === "undefined") return "demo-farmer";
  return window.localStorage.getItem("farmerUserId") || "demo-farmer";
}

export async function updateInventory(
  listingId: string,
  amount: number,
  type: InventoryUpdateType
) {
  const userId = getUserId();

  const res = await fetch(`${API_BASE}/api/listings/${listingId}/inventory`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify({ amount, type }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to update inventory");
  }

  return res.json();
}

