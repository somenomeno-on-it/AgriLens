"use client";

import dynamic from "next/dynamic";
import "./map.css";

const GuestMapClient = dynamic(() => import("@/components/map/GuestMapClient"), {
  ssr: false,
});

export default function GuestMapPage() {
  return <GuestMapClient />;
}

