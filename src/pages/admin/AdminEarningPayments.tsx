// src/pages/admin/AdminEarningPayments.tsx
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users as UsersIcon,
  Clock,
  Mail,
  MinusCircle,
  DollarSign,
  Hourglass,
  CircleArrowOutDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8085/";
const PAGE_SIZE = 25;

type EarningPaymentRow = {
  transaction_id: number;
  user_id: string;
  user_name: string | null;
  node_type: string; // e.g., "recharge", "order", etc.
  node_id: number; // related entity id
  reference: string | null;
  type: "in" | "out"; // we will only get "in" here
  amount: number;
  date: string; // timestamp
};

function StatCard({
  title,
  value,
  gradient,
  Icon,
}: {
  title: string;
  value: number | string;
  gradient: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl px-6 py-7 text-white shadow-sm bg-gradient-to-tr ${gradient}`}
    >
      {/* soft pattern circle on the right */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/20" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-28 w-28 rounded-full bg-white/10" />

      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl font-extrabold leading-none">{value}</div>
          <div className="mt-2 text-xl font-semibold opacity-95">{title}</div>
        </div>
        <div className="shrink-0">
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-white/15">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminEarningPayments() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);

  const [rows, setRows] = useState<EarningPaymentRow[]>([]);
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartMethods, setChartMethods] = useState<string[]>([]);

  const [selected, setSelected] = useState<EarningPaymentRow | null>(null);

  const load = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE), // fixed 25
      });
      const r = await fetch(
        `${API_BASE_URL}/api/admin/earning-payments?${params.toString()}`,
        { headers }
      );
      if (!r.ok) throw new Error("Failed to load earning payments");
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

  const loadStats = async () => {
    try {
      const r = await fetch(
        `${API_BASE_URL}/api/admin/earning-payments/log-points-stats`,
        {
          headers,
        }
      );
      if (!r.ok) throw new Error("Failed to load stats");
      const data = await r.json();
      setStats(data);
    } catch (e: any) {
      toast.error("Stats load failed", { description: e?.message });
    }
  };

  const loadChart = async () => {
    try {
      const r = await fetch(
        `${API_BASE_URL}/api/admin/earning-payments/payin-methods`,
        {
          headers,
        }
      );
      if (!r.ok) throw new Error("Failed to load chart");
      const data = await r.json();
      setChartData(data.data);
      setChartMethods(data.methods);
    } catch (e: any) {
      toast.error("Chart load failed", { description: e?.message });
    }
  };

  useEffect(() => {
    if (ready) {
      load();
      loadStats(); // ✅ also load stats from log_points
      loadChart(); // ✅ load chart
    }
  }, [ready, page]);

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Earnings - Payments</h1>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h2 className="text-xl font-bold mb-4">PayIn Methods</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {chartMethods.map((method, idx) => (
              <Bar
                key={method}
                dataKey={method}
                fill={idx === 0 ? "#3b82f6" : "#8b5cf6"}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard
          title="Total PayIn"
          value={stats ? stats.totalPayIn.toFixed(2) : "—"}
          gradient="from-indigo-500 to-blue-500"
          Icon={DollarSign}
        />
        <StatCard
          title="This Month PayIn"
          value={stats ? stats.totalPayInMonth.toFixed(2) : "—"}
          gradient="from-green-500 to-emerald-500"
          Icon={DollarSign}
        />
        <StatCard
          title="Total Pending PayOut"
          value={stats ? stats.pendingPayOut.toFixed(2) : "—"}
          gradient="from-purple-500 to-violet-500"
          Icon={Hourglass}
        />
        <StatCard
          title="This Month Pending PayOut"
          value={stats ? stats.pendingPayOutMonth.toFixed(2) : "—"}
          gradient="from-pink-500 to-rose-500"
          Icon={Hourglass}
        />
        <StatCard
          title="Total Approved PayOut"
          value={stats ? stats.totalPayOut.toFixed(2) : "—"}
          gradient="from-yellow-500 to-amber-500"
          Icon={CircleArrowOutDownRight}
        />
        <StatCard
          title="This Month Approved PayOut"
          value={stats ? stats.totalPayOutMonth.toFixed(2) : "—"}
          gradient="from-red-500 to-orange-500"
          Icon={CircleArrowOutDownRight}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        {/* Top summary (no filters) */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            {total.toLocaleString()} total • Page {page} of {totalPages} •{" "}
            {PAGE_SIZE} / page
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Txn ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Node</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((r) => (
                  <TableRow key={r.transaction_id}>
                    <TableCell>{r.transaction_id}</TableCell>
                    <TableCell>{r.user_name ?? r.user_id}</TableCell>
                    <TableCell className="capitalize">{r.type}</TableCell>
                    <TableCell>
                      {r.node_type}
                      {r.node_id ? ` #${r.node_id}` : ""}
                    </TableCell>
                    <TableCell>{r.amount}</TableCell>
                    <TableCell>{r.reference ?? "—"}</TableCell>
                    <TableCell>{new Date(r.date).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <button
                        className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
                        onClick={() => setSelected(r)}
                      >
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
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
            Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–
            {(page - 1) * PAGE_SIZE + rows.length} of {total}
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

        {/* Details popup (read-only) */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Earning Payment Details</DialogTitle>
              <DialogDescription>
                Transaction #{selected?.transaction_id}
              </DialogDescription>
            </DialogHeader>

            {selected && (
              <div className="space-y-3 text-md">
                <div>
                  <strong>User:</strong>{" "}
                  {selected.user_name ?? selected.user_id}
                </div>
                <div>
                  <strong>Type:</strong> {selected.type}
                </div>
                <div>
                  <strong>Node:</strong> {selected.node_type}
                  {selected.node_id ? ` #${selected.node_id}` : ""}
                </div>
                <div>
                  <strong>Amount:</strong> {selected.amount}
                </div>
                <div>
                  <strong>Reference:</strong> {selected.reference ?? "—"}
                </div>
                <div>
                  <strong>Date:</strong>{" "}
                  {new Date(selected.date).toLocaleString()}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
