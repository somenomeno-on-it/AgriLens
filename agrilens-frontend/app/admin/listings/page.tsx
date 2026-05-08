"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import AdminRoute from "@/components/AdminRoute";
import { PublicStatsWidgets } from "@/components/charts/PublicStatsWidgets";
import { getAdminHeaders } from "@/lib/adminApi";
import "../../guest/map/map.css";

const GuestMapClient = dynamic(() => import("@/components/map/GuestMapClient"), {
  ssr: false,
});

function AdminListingsInner() {
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [radius, setRadius] = useState<number>(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.8, 90.4]);
  const adminHeaders = useMemo(() => getAdminHeaders(), []);

  return (
    <div className="-m-8">
      <div className="guest-map-shell">
        <GuestMapClient
          district={district}
          setDistrict={setDistrict}
          upazila={upazila}
          setUpazila={setUpazila}
          radius={radius}
          setRadius={setRadius}
          mapCenter={mapCenter}
          setMapCenter={setMapCenter}
          showFarms={true}
          showFarmDetails={true}
          farmsEndpoint="/api/admin/map/farms"
          requestHeaders={adminHeaders}
        />
      </div>
      <PublicStatsWidgets
        district={district}
        upazila={upazila}
        radius={radius}
        mapCenter={mapCenter}
      />
    </div>
  );
}

export default function AdminListingsPage() {
  return (
    <AdminRoute>
      <AdminListingsInner />
    </AdminRoute>
  );
}
