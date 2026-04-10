"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, getAdminHeaders } from "@/lib/adminApi";

type RoleTab = "farmer" | "agent";

type UserRow = { //user row object type
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastActive: string;
  listingCount: number;
  reviewCount: number;
  isSuspended: boolean;
};

//setting up the state
function AdminUsersPageInner() { 
  const searchParams = useSearchParams(); //get the search params from the URL
  const [tab, setTab] = useState<RoleTab>("farmer"); //set the tab to farmer
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); //set the debounced search to the search(avoid calling API in every key press)
  const [page, setPage] = useState(1); 
  const limit = 20; //set the limit to 20
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = searchParams.get("tab"); //get the tab from the URL
    if (t === "agent") setTab("agent");
    if (t === "farmer") setTab("farmer");
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350); //When search changes (user typing), it waits 350ms before updating 
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1); //reset the page to 1 when the tab or debounced search changes
  }, [tab, debouncedSearch]);

  const load = useCallback(async () => { //The function loads the users from the backend
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        role: tab,
        page: String(page),
        limit: String(limit),
      });
      if (debouncedSearch) qs.set("search", debouncedSearch);
      const res = await fetch(`${API_BASE}/api/admin/users?${qs}`, { //fetch the users from the backend
        headers: getAdminHeaders(),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load users"); 
      const json = await res.json();
      setRows(json.data || []);
      setTotalPages(json.pagination?.totalPages ?? 0);
      setTotal(json.pagination?.total ?? 0);
    } catch {
      setRows([]); //clear the rows if the users fail to load
      setTotalPages(0); //clear the total pages if the users fail to load
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search farmers and agents, view activity summary, and open profiles.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={tab === "farmer" ? "default" : "outline"}
          onClick={() => setTab("farmer")}
        >
          Farmers
        </Button>
        <Button
          type="button"
          variant={tab === "agent" ? "default" : "outline"}
          onClick={() => setTab("agent")}
        >
          Agents
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <Input
          placeholder="Search name, email, or user id…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <span className="text-sm text-muted-foreground">
          {total} total · page {page} of {Math.max(totalPages, 1)}
        </span>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium text-right">
                {tab === "farmer" ? "Listings" : "Reviews"}
              </th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Last active</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{u.name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "farmer"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {tab === "farmer" ? u.listingCount : u.reviewCount}
                  </td>
                  <td className="p-3">
                    {u.isSuspended ? (
                      <span className="text-amber-700 font-medium">Suspended</span>
                    ) : (
                      <span className="text-emerald-700">Active</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {u.lastActive
                      ? new Date(u.lastActive).toLocaleString()
                      : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/users/${u.id}?role=${tab}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={loading || totalPages === 0 || page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground p-6">Loading…</div>}>
      <AdminUsersPageInner />
    </Suspense>
  );
}
