// src/pages/admin/Paymentrequest.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8085";

type Row = {
  id: number;
  user_id: number;
  user_name: string;
  handle: string;
  amount: string; // stored as varchar
  method: "bank" | "gada_token";
  transferTo: string;
  time: string;
  status: -1 | 0 | 1;
};

export default function Paymentrequest() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);

  // data
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // filters
  const [status, setStatus] = useState<"all" | "-1" | "0" | "1">("0"); // default Pending
  const [method, setMethod] = useState<"all" | "bank" | "gada_token">("all");
  const [q, setQ] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;

  const fetchRows = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status,
        method,
      });
      if (q) params.set("q", q);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const r = await fetch(
        `${API_BASE_URL}/api/wallet/withdrawals/admin?${params.toString()}`,
        { headers }
      );
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setHasPrev(!!data.hasPrev);
      setHasNext(!!data.hasNext);
    } catch (e: any) {
      toast.error("Failed to load withdrawal requests", { description: e?.message });
    }
  };

  useEffect(() => {
    if (ready) fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, page, pageSize, status, method]);

  const approve = async (id: number) => {
    try {
      const r = await fetch(
        `${API_BASE_URL}/api/wallet/withdrawals/${id}/approve`,
        { method: "POST", headers }
      );
      if (!r.ok) throw new Error(await r.text());
      toast.success("Request approved");
      fetchRows();
    } catch (e: any) {
      toast.error("Approve failed", { description: e?.message });
    }
  };

  const decline = async (id: number) => {
    try {
      const r = await fetch(
        `${API_BASE_URL}/api/wallet/withdrawals/${id}/decline`,
        { method: "POST", headers }
      );
      if (!r.ok) throw new Error(await r.text());
      toast.success("Request declined");
      fetchRows();
    } catch (e: any) {
      toast.error("Decline failed", { description: e?.message });
    }
  };

  const clearFilters = () => {
    setStatus("0");
    setMethod("all");
    setQ("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    fetchRows();
  };

  // pagination window
  function pageWindow(curr: number, total: number) {
    const pages: (number | "…")[] = [];
    const push = (v: number | "…") => pages.push(v);
    if (total <= 7) {
      for (let i = 1; i <= total; i++) push(i);
      return pages;
    }
    push(1);
    if (curr > 3) push("…");
    const start = Math.max(2, curr - 1);
    const end = Math.min(total - 1, curr + 1);
    for (let i = start; i <= end; i++) push(i);
    if (curr < total - 2) push("…");
    push(total);
    return pages;
  }
  const pages = pageWindow(page, totalPages);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-end justify-between mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 w-full">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Pending</SelectItem>
                <SelectItem value="1">Approved</SelectItem>
                <SelectItem value="-1">Declined</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Method</label>
            <Select value={method} onValueChange={(v) => { setMethod(v as any); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="gada_token">gada token</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Search</label>
            <div className="flex gap-2">
              <Input
                placeholder="User / handle / transfer to"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (setPage(1), fetchRows())}
              />
              <Button onClick={() => (setPage(1), fetchRows())}>Search</Button>
              <Button variant="secondary" onClick={clearFilters}>Clear</Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-gray-500 min-w-[140px] text-right">
            {total.toLocaleString()} total
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transfer To</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length ? (
              items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.user_name}</TableCell>
                  <TableCell>{r.handle}</TableCell>
                  <TableCell className="capitalize">{r.method}</TableCell>
                  <TableCell>{fmt(Number(r.amount))}</TableCell>
                  <TableCell className="truncate max-w-[260px]" title={r.transferTo}>
                    {r.transferTo}
                  </TableCell>
                  <TableCell>{new Date(r.time).toLocaleString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" onClick={() => approve(r.id)}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => decline(r.id)}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500">
                  No requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {items.length ? (page - 1) * pageSize + 1 : 0}–
          {(page - 1) * pageSize + items.length} of {total}
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPage(1)}
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              >
                First
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={hasPrev ? "" : "pointer-events-none opacity-50"}
              />
            </PaginationItem>

            {pageWindow(page, totalPages).map((p, idx) =>
              p === "…" ? (
                <PaginationItem key={`ell-${idx}`}>
                  <span className="px-2 text-gray-400">…</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={p as number}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={hasNext ? "" : "pointer-events-none opacity-50"}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPage(totalPages)}
                aria-disabled={page === totalPages}
                className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              >
                Last
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
