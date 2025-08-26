// src/pages/admin/subscribers/AdminSubscribers.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { listSubscribers, exportSubscribersCSV, type SubscriberRow } from "@/services/adminSubscribersService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileDown } from "lucide-react";

function fmtHuman(d: string) {
  // expects `YYYY-MM-DD HH:mm:ss` from SQL
  const t = d.replace(" ", "T");
  const date = new Date(t);
  return isNaN(date.getTime()) ? d : date.toLocaleString();
}

export default function AdminSubscribers() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);

  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "expired">("all");
  const [pkg, setPkg] = useState<string>("");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await listSubscribers(headers, { page, pageSize, search, status, packageName: pkg, order });
      setRows(d.items);
      setTotal(d.total);
      setTotalPages(d.totalPages);
    } catch (e: any) {
      toast.error("Failed to load subscribers", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (ready) load(); /* eslint-disable-next-line */ }, [ready, page, pageSize, status, pkg, order]);

  const exportCsv = async () => {
    try {
      const { blob, filename } = await exportSubscribersCSV(headers, { page, pageSize, search, status, packageName: pkg, order });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error("Export failed", { description: e?.message });
    }
  };

  const pages = useMemo(() => {
    const arr: (number | "…")[] = [];
    if (totalPages <= 7) { for (let i=1;i<=totalPages;i++) arr.push(i); return arr; }
    arr.push(1);
    if (page > 3) arr.push("…");
    const s = Math.max(2, page-1), e = Math.min(totalPages-1, page+1);
    for (let i=s;i<=e;i++) arr.push(i);
    if (page < totalPages-2) arr.push("…");
    arr.push(totalPages);
    return arr;
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 p-6 md:p-7">
        {/* Top controls */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 flex flex-wrap gap-2">
            <Input
              placeholder="Search by user / handle"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full sm:w-[340px]"
            />
            <Button className="h-11" onClick={() => { setPage(1); load(); }}>Search</Button>

            <Select value={String(pageSize)} onValueChange={(v) => { setPage(1); setPageSize(Number(v)); }}>
              <SelectTrigger className="h-11 w-[120px]">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v: "all"|"active"|"expired") => { setPage(1); setStatus(v); }}>
              <SelectTrigger className="h-11 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={pkg} onValueChange={(v) => { setPage(1); setPkg(v); }}>
              <SelectTrigger className="h-11 w-[160px]">
                <SelectValue placeholder="Package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Packages</SelectItem>
                <SelectItem value="GADA VIP">GADA VIP</SelectItem>
                <SelectItem value="GADA VVIP">GADA VVIP</SelectItem>
              </SelectContent>
            </Select>

            <Select value={order} onValueChange={(v: "newest" | "oldest") => { setPage(1); setOrder(v); }}>
              <SelectTrigger className="h-11 w-[140px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-11 gap-2" onClick={exportCsv}>
              <FileDown className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead className="min-w-[220px]">User</TableHead>
                  <TableHead className="min-w-[160px]">Handle</TableHead>
                  <TableHead className="min-w-[160px]">Package</TableHead>
                  <TableHead className="min-w-[180px]">Subscription</TableHead>
                  <TableHead className="min-w-[260px]">Expiration</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center text-slate-500">Loading…</TableCell></TableRow>
                ) : rows.length ? (
                  rows.map((r, idx) => {
                    const days = Number(r.remainingDays);
                    const isActive = r.status === "Active";
                    const remainText = isActive ? `(Remaining ${days} ${Math.abs(days) === 1 ? "Day" : "Days"})` : "(Expired)";
                    return (
                      <TableRow key={`${r.userId}-${r.time}`} className={idx % 2 ? "bg-white" : "bg-slate-50/40"}>
                        <TableCell>{r.userId}</TableCell>
                        <TableCell className="font-medium text-slate-900">{r.user ?? "—"}</TableCell>
                        <TableCell className="text-slate-600">{r.handle ?? "—"}</TableCell>
                        <TableCell className="font-medium">{r.packageName}</TableCell>
                        <TableCell>{fmtHuman(r.subscription)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{fmtHuman(r.expiration)}</span>
                            <span className={`text-xs ${isActive ? "text-emerald-600" : "text-rose-600"}`}>{remainText}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1
                            ${isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
                            {r.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center text-slate-500">No records</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer / Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {rows.length ? (page - 1) * pageSize + 1 : 0} to {(page - 1) * pageSize + rows.length} of {total}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(1)} className="rounded-xl">First</Button>
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl">Prev</Button>
            {pages.map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-2 text-slate-500">…</span>
              ) : (
                <Button key={p as number} size="sm" variant={p === page ? "default" : "secondary"} onClick={() => setPage(p as number)} className="rounded-xl">{p}</Button>
              )
            )}
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-xl">Next</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="rounded-xl">Last</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
