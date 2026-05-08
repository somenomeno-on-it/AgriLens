"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import "./map.css";

const GuestMapClient = dynamic(() => import("@/components/map/GuestMapClient"), {
  ssr: false,
});

import { PublicStatsWidgets } from "@/components/charts/PublicStatsWidgets";

export default function GuestMapPage() {
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [radius, setRadius] = useState<number>(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.8, 90.4]);

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="w-full">
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
          renderFarmMarkers={false}
          forceHeatmap={true}
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

