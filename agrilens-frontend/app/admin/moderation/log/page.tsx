"use client";

import { useEffect, useState } from "react";
import { getAdminHeaders, API_BASE } from "@/lib/adminApi";
import { Card } from "@/components/ui/card";

export default function ModerationLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/moderation/log`, {
        headers: getAdminHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch log");
      const data = await res.json();
      setLogs(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Moderation Log</h1>
      <p className="text-muted-foreground text-sm">History of removals and reinstatements.</p>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-4 text-left font-medium">Action</th>
              <th className="p-4 text-left font-medium">Admin</th>
              <th className="p-4 text-left font-medium">Listing (Crop)</th>
              <th className="p-4 text-left font-medium">Reason</th>
              <th className="p-4 text-left font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">No logs found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      log.action === "admin_remove_listing" 
                        ? "bg-red-100 text-red-700" 
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {log.action === "admin_remove_listing" ? "Removed" : "Reinstated"}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{log.adminName}</td>
                  <td className="p-4">{log.cropType}</td>
                  <td className="p-4 italic text-muted-foreground">{log.reason || "N/A"}</td>
                  <td className="p-4 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
