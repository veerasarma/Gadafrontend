// src/pages/admin/AdminBankTransfers.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8085/";

type BankTransferRow = {
  transfer_id: string;
  user_id: string;
  user_name: string;
  handle: string;
  package_id: string | null;
  post_id: string | null;
  plan_id: string | null;
  movie_id: string | null;
  orders_collection_id: string | null;
  price: number;
  bank_receipt: string;
  time: string;
  status: number; // 1 = success, -1 = failed, 0 = pending maybe
};

export default function AdminBankTransfers() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);

  const [rows, setRows] = useState<BankTransferRow[]>([]);
  const [status, setStatus] = useState<"all" | "1" | "-1">("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [selected, setSelected] = useState<BankTransferRow | null>(null);

  const load = async () => {
    try {
      const params = new URLSearchParams({
        status,
        search: q,
        page: String(page),
        limit: String(limit),
      });
      const r = await fetch(
        `${API_BASE_URL}/api/admin/bank-transfers?${params.toString()}`,
        { headers }
      );
      if (!r.ok) throw new Error("Failed to load bank transfers");
      const data = await r.json();
      setRows(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setHasPrev(!!data.hasPrev);
      setHasNext(!!data.hasNext);
    } catch (e: any) {
      toast.error("Load failed", { description: e?.message });
    }
  };

  useEffect(() => {
    if (ready) load();
  }, [ready, status, page, limit]);

  const act = async (id: string, action: "accept" | "decline" | "pending") => {
    try {
      const r = await fetch(
        `${API_BASE_URL}/api/admin/bank-transfers/${id}/status`,
        {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      if (!r.ok) throw new Error("Action failed");
      toast.success("Updated");
      load();
    } catch (e: any) {
      toast.error("Failed", { description: e?.message });
    }
  };

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
      <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* <Select
            value={status}
            onValueChange={(v) => {
              setPage(1);
              setStatus(v as any);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="1">Success</SelectItem>
              <SelectItem value="-1">Failed</SelectItem>
              <SelectItem value="0">Pending</SelectItem>
            </SelectContent>
          </Select> */}

          <Input
            placeholder="Search by user / handle"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
            className="w-full sm:w-64"
          />
          <Button
            onClick={() => {
              setPage(1);
              load();
            }}
          >
            Search
          </Button>

          <Select
            value={String(limit)}
            onValueChange={(v) => {
              setPage(1);
              setLimit(Number(v));
            }}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-gray-500">
          {total.toLocaleString()} total • Page {page} of {totalPages}
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
              {/* <TableHead>Package</TableHead> */}
              <TableHead>Price</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((r) => (
                <TableRow key={r.transfer_id}>
                  <TableCell>{r.transfer_id}</TableCell>
                  <TableCell>{r.user_name}</TableCell>
                  <TableCell>{r.handle}</TableCell>
                  {/* <TableCell>{r.package_id ?? "---"}</TableCell> */}
                  <TableCell>{r.price ?? "---"}</TableCell>
                  <TableCell>
                    {r.bank_receipt ? (
                      <a
                        href={`${API_BASE_URL}/uploads/${r.bank_receipt}`}
                        target="_blank"
                        className="text-blue-500 underline"
                      >
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{new Date(r.time).toLocaleString()}</TableCell>
                  <TableCell>
                    {r.status === 1
                      ? "Success"
                      : r.status === -1
                      ? "Failed"
                      : "Pending"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      onClick={() => act(r.transfer_id, "accept")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => act(r.transfer_id, "decline")}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(r)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-500">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {rows.length ? (page - 1) * limit + 1 : 0}–
          {(page - 1) * limit + rows.length} of {total}
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

            {pages.map((p, idx) =>
              p === "…" ? (
                <PaginationItem key={`ell-${idx}`}>
                  <span className="px-2 text-gray-400">…</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
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
                className={
                  page === totalPages ? "pointer-events-none opacity-50" : ""
                }
              >
                Last
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Popup for details */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bank Transfer Details</DialogTitle>
            <DialogDescription>
              Transfer #{selected?.transfer_id}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-3 text-md">
              <div>
                <strong>User:</strong> {selected.user_name}
              </div>
              <div>
                <strong>Handle:</strong> {selected.handle}
              </div>
              {/* <div>
                <strong>Package:</strong> {selected.package_id ?? "---"}
              </div> */}
              <div>
                <strong>Price:</strong> {selected.price ?? "---"}
              </div>
              <div>
                <strong>Receipt:</strong>{" "}
                {selected.bank_receipt ? (
                  <a
                    href={`${API_BASE_URL}/uploads/${selected.bank_receipt}`}
                    target="_blank"
                    className="text-blue-500 underline"
                  >
                    View Receipt
                  </a>
                ) : (
                  "-"
                )}
              </div>
              <div>
                <strong>Time:</strong>{" "}
                {new Date(selected.time).toLocaleString()}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                {selected.status === 1
                  ? "Success"
                  : selected.status === -1
                  ? "Failed"
                  : "Pending"}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
