// src/pages/admin/packages/PackagesList.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { listPackages, deletePackage, type PackageRow } from "@/services/adminPackagesService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

const ASSETS = import.meta.env.VITE_ASSETS_BASE_URL ?? "";

export default function PackagesList() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);

  const [rows, setRows] = useState<PackageRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("package_order");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await listPackages(headers, { page, pageSize, search, sort, order });
      setRows(d.items);
      setTotal(d.total);
      setTotalPages(d.totalPages);
    } catch (e: any) {
      toast.error("Failed to load packages", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (ready) load(); }, [ready, page, pageSize, sort, order]);

  const onDelete = async (id: number) => {
    if (!confirm("Delete this package? This cannot be undone.")) return;
    try {
      await deletePackage(headers, id);
      toast.success("Package deleted");
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (e: any) {
      toast.error("Delete failed", { description: e?.message });
    }
  };

  const fmtPeriod = (n: number, unit: string) => `${n} ${unit[0].toUpperCase() + unit.slice(1)}`;

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
      {/* White container */}
      <div className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 p-6 md:p-7">
        {/* Top bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <h1 className="text-[28px] leading-8 font-extrabold text-slate-900">Pro System › Packages</h1>
          <div className="flex w-full md:w-auto items-center gap-2">
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 md:w-[420px]"
            />
            <Button className="h-11" onClick={() => { setPage(1); load(); }}>
              Search
            </Button>
            <Button className="h-11 gap-2" onClick={() => navigate("/admin/packages/new")}>
              <Plus className="h-5 w-5" />
              Add New Package
            </Button>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPage(1); setPageSize(Number(v)); }}>
              <SelectTrigger className="w-24 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-500">entries</span>
          </div>

          <div className="flex items-center gap-2">
            <Select value={`${sort}:${order}`} onValueChange={(v) => {
              const [s,o] = v.split(":") as any; setSort(s); setOrder(o);
            }}>
              <SelectTrigger className="w-44 h-10">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="package_order:asc">Order ↑</SelectItem>
                <SelectItem value="package_order:desc">Order ↓</SelectItem>
                <SelectItem value="name:asc">Name A–Z</SelectItem>
                <SelectItem value="name:desc">Name Z–A</SelectItem>
                <SelectItem value="price:asc">Price ↑</SelectItem>
                <SelectItem value="price:desc">Price ↓</SelectItem>
                <SelectItem value="period_num:asc">Period (num) ↑</SelectItem>
                <SelectItem value="period_num:desc">Period (num) ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead className="min-w-[280px]">Name</TableHead>
                  <TableHead className="min-w-[150px]">Price (₦)</TableHead>
                  <TableHead className="min-w-[140px]">Period</TableHead>
                  <TableHead className="min-w-[100px]">Order</TableHead>
                  <TableHead className="text-right min-w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-slate-500">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((r, idx) => (
                    <TableRow key={r.package_id} className={idx % 2 ? "bg-white" : "bg-slate-50/40"}>
                      <TableCell className="font-medium">{r.package_id}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          {r.icon ? (
                            <img
                              src={`${ASSETS}/${r.icon}`}
                              alt=""
                              className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-slate-100 ring-1 ring-slate-200" />
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{r.name}</span>
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-slate-300"
                              style={{ backgroundColor: r.color }}
                              title={r.color}
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="font-semibold">{r.price}</TableCell>
                      <TableCell>{fmtPeriod(r.period_num, r.period)}</TableCell>
                      <TableCell>{r.package_order}</TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => navigate(`/admin/packages/${r.package_id}/edit`)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-full"
                            onClick={() => onDelete(r.package_id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-slate-500">
                      No packages
                    </TableCell>
                  </TableRow>
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
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(1)} className="rounded-xl">
              First
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl"
            >
              Prev
            </Button>

            {useMemo(() => {
              const arr: (number | "…")[] = [];
              if (totalPages <= 7) { for (let i=1;i<=totalPages;i++) arr.push(i); }
              else {
                arr.push(1);
                if (page > 3) arr.push("…");
                const s = Math.max(2, page-1), e = Math.min(totalPages-1, page+1);
                for (let i=s;i<=e;i++) arr.push(i);
                if (page < totalPages-2) arr.push("…");
                arr.push(totalPages);
              }
              return arr;
            }, [page, totalPages]).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-2 text-slate-500">…</span>
              ) : (
                <Button
                  key={p as number}
                  size="sm"
                  variant={p === page ? "default" : "secondary"}
                  onClick={() => setPage(p as number)}
                  className={`rounded-xl ${p === page ? "" : ""}`}
                >
                  {p}
                </Button>
              )
            )}

            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl"
            >
              Next
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="rounded-xl"
            >
              Last
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
