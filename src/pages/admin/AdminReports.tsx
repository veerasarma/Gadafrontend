// src/admin/pages/AdminReports.tsx
import { useEffect, useMemo, useState } from "react";
import { Check, Trash2, ExternalLink, Search, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { stripUploads } from "@/lib/url";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

type Reporter = {
  id: number;
  username?: string | null;
  fullName?: string | null;
  avatar?: string | null;
};

type ReportRow = {
  id: number;
  nodeId: number;
  type: string;          // "post" etc.
  category: string;
  reason: string;
  reporter: Reporter;
  time: string | null;
};

type ApiList = {
  ok: boolean;
  total: number;
  pages: number;
  page: number;
  items: ReportRow[];
};

const initials = (s?: string | null) =>
  (s || "?")
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0]!.toUpperCase())
    .slice(0, 2)
    .join("");

export default function AdminReports() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<ReportRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(10);

  async function load(p = page) {
    setBusy(true);
    try {
      const url = new URL(`${API_BASE}/api/admin/reports`);
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(limit));
      if (q.trim()) url.searchParams.set("q", q.trim());
      const r = await fetch(url.toString(), { headers });
      const j: ApiList = await r.json();
      if (!j?.ok) throw new Error("Failed");
      setList(j.items || []);
      setPage(j.page);
      setPages(j.pages);
      setTotal(j.total);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, limit]);

  async function markSafe(id: number) {
    if (!confirm("Mark this report as safe? This removes the report entry.")) return;
    const r = await fetch(`${API_BASE}/api/admin/reports/${id}/mark-safe`, {
      method: "POST",
      headers
    });
    const j = await r.json();
    if (j?.ok) {
      setList(prev => prev.filter(x => x.id !== id));
      setTotal(t => Math.max(0, t - 1));
    }
  }

  async function removeReport(id: number) {
    if (!confirm("Delete this report entry?")) return;
    const r = await fetch(`${API_BASE}/api/admin/reports/${id}`, {
      method: "DELETE",
      headers
    });
    const j = await r.json();
    if (j?.ok) {
      setList(prev => prev.filter(x => x.id !== id));
      setTotal(t => Math.max(0, t - 1));
    }
  }

  async function markAllSafe() {
    if (!confirm("Mark ALL reports as safe? This clears the table.")) return;
    // let ids;
    // ids.push(list.map((x) => x.id));
    // console.log(ids,'ids')
    const r = await fetch(`${API_BASE}/api/admin/reports/bulk/mark-safe`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ids: [] }),
    });
    const j = await r.json();
    if (j?.ok) {
      setList([]);
      setTotal(0);
      setPages(1);
      setPage(1);
    }
  }

  const showingText = useMemo(() => {
    if (total === 0) return "Showing 0 of 0";
    const start = (page - 1) * limit + 1;
    const end = Math.min(total, page * limit);
    return `Showing ${start}–${end} of ${total}`;
  }, [page, limit, total]);

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-[1400px]">
        {/* White card wrapper */}
        <div className="rounded-2xl bg-white border shadow-sm">
          {/* Header */}
          <div className="p-4 md:p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-gray-700" />
              <h1 className="text-xl font-semibold">Reports</h1>
            </div>
            <Button
              onClick={markAllSafe}
              variant="destructive"
              className="bg-rose-600 hover:bg-rose-700"
            >
              Mark All As Safe
            </Button>
          </div>

          {/* Toolbar */}
          <div className="px-4 md:px-6 py-3 border-b flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="h-9 rounded-md border px-2 text-sm"
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm text-gray-500">entries</span>
            </div>

            <div className="ml-auto relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Search…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 w-[260px] bg-white"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left w-[60px]">ID</th>
                  <th className="px-3 py-2 text-left">Node</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Reporter By</th>
                  <th className="px-3 py-2 text-left">Reporter For</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {busy && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Loading…
                    </td>
                  </tr>
                )}
                {!busy && list.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                      No reports
                    </td>
                  </tr>
                )}
                {list.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.id}</td>
                    <td className="px-3 py-2">
                      <a
                        href={`/posts/${r.nodeId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#1877F2] hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View Post
                      </a>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex px-2 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium">
                        {r.type?.toUpperCase() || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={
                              r.reporter?.avatar
                                ? `${API_BASE}/uploads/${stripUploads(r.reporter.avatar)}`
                                : ""
                            }
                          />
                          <AvatarFallback>
                            {initials(r.reporter?.fullName || r.reporter?.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="truncate max-w-[220px]">
                          <div className="font-medium truncate">
                            {r.reporter?.fullName || r.reporter?.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="min-w-[120px]">
                        <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                          {r.category || "—"}
                        </div>
                        {r.reason ? (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-[220px]">
                            {r.reason}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {r.time
                        ? new Date(r.time).toLocaleString(undefined, {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => markSafe(r.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check className="h-4 w-4 mr-1" /> Safe
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeReport(r.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 md:px-6 py-3 border-t flex flex-wrap items-center gap-3">
            <div className="text-sm text-gray-500">{showingText}</div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const next = Math.max(1, page - 1);
                  setPage(next);
                  void load(next);
                }}
              >
                Prev
              </Button>
              <div className="px-3 py-1 border rounded">{page}</div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => {
                  const next = Math.min(pages, page + 1);
                  setPage(next);
                  void load(next);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
