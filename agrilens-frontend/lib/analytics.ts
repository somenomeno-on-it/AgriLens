import { getAuthHeaders, getCurrentUserId } from "@/lib/auth";

export type PriceSeriesPoint = {
  date: string;
  price: number;
  pointCount: number;
};

export type QuantityByCropPoint = {
  cropType: string;
  quantity: number;
  soldQuantity: number;
  reservedQuantity: number;
  listingsCount: number;
};

export type FarmerAnalyticsResponse = {
  meta: {
    farmerId: string;
    cropType: string;
    startDate: string;
    endDate: string;
  };
  priceSeries: PriceSeriesPoint[];
  quantityByCrop: QuantityByCropPoint[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export async function fetchFarmerAnalytics(params: {
  startDate: string;
  endDate: string;
  cropType: string; // "all" or a concrete crop type
}): Promise<FarmerAnalyticsResponse> {
  const userId = getCurrentUserId();
  const { startDate, endDate, cropType } = params;

  const qs = new URLSearchParams({
    startDate,
    endDate,
    cropType,
  });

  const res = await fetch(`${API_BASE}/api/farmer/${userId}/analytics?${qs}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch analytics");
  }

  return res.json();
}

