// src/components/wallet/ManualWithdrawal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Landmark, Coins, CreditCard } from "lucide-react";
import { createWithdrawal, fetchWithdrawals, type WithdrawRow } from "@/services/withdrawService";
import { format } from "date-fns";

type Props = {
  headers: Record<string, string>;
  balance: number;
  refreshBalance?: () => void; // optional callback to re-fetch wallet balance
};

type StatusFilter = "all" | "-1" | "0" | "1";
type MethodFilter = "all" | "bank" | "gada_token";

export default function ManualWithdrawal({ headers, balance, refreshBalance }: Props) {
  // --- Form state ---
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<"bank" | "gada_token">("bank");
  const [transferTo, setTransferTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- History state ---
  const [list, setList] = useState<WithdrawRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [filterMethod, setFilterMethod] = useState<MethodFilter>("all");
  const [q, setQ] = useState<string>("");

  // Debounce for search
  const searchRef = useRef<number | null>(null);

  // Initial load + on filter change
  useEffect(() => {
    // debounce text search
    if (searchRef.current) window.clearTimeout(searchRef.current);
    searchRef.current = window.setTimeout(() => {
      loadFirstPage();
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, filterStatus, filterMethod, q]);

  useEffect(() => {
    // load first page on mount
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers]);

  const loadFirstPage = async () => {
    setLoadingList(true);
    try {
      const resp = await fetchWithdrawals(headers, {
        page: 1,
        pageSize,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: filterStatus,
        method: filterMethod,
        q: q || undefined,
      });
      console.log(resp,'resprespresp')
      setList(resp.data);
      setPage(resp.page);
      setHasMore(resp.hasMore);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load history");
    } finally {
      setLoadingList(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore) return;
    try {
      const resp = await fetchWithdrawals(headers, {
        page: page + 1,
        pageSize,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: filterStatus,
        method: filterMethod,
        q: q || undefined,
      });
      setList((prev) => [...prev, ...resp.data]);
      setPage(resp.page);
      setHasMore(resp.hasMore);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load more");
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterStatus("all");
    setFilterMethod("all");
    setQ("");
  };

  const MIN_WITHDRAW = 1000;

  const disableSubmit = useMemo(() => {
    const a = Number(amount || 0);
    return !a || a < MIN_WITHDRAW || !transferTo.trim() || submitting;
  }, [amount, transferTo, submitting]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount || 0);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt < MIN_WITHDRAW) return toast.error(`Minimum withdrawal is ₦${MIN_WITHDRAW}`);
    if (!transferTo.trim()) return toast.error("Please fill ‘Transfer To’");

    try {
      setSubmitting(true);
      await createWithdrawal(headers, { amount: amt, method, transferTo: transferTo.trim() });
      toast.success("Withdrawal request submitted");
      setAmount("");
      setTransferTo("");
      await refreshBalance?.();
      await loadFirstPage();
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (v: number) =>
    `₦${(isNaN(v) ? 0 : v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* ===== Top cards (Balance / Method / Amount) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance card */}
        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Your Balance</p>
            <p className="text-2xl font-semibold">{fmt(balance || 0)}</p>
          </div>
        </div>

        {/* Method card */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm text-gray-600 mb-2">Withdrawal Method</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                method === "bank" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-400"}`}>
              <input type="radio" name="withdrawMethod" className="hidden" value="bank"
                     checked={method === "bank"} onChange={() => setMethod("bank")} />
              <div className="h-9 w-9 rounded-md bg-emerald-100 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="font-medium">Bank Transfer</span>
            </label>

            <label className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                method === "gada_token" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-400"}`}>
              <input type="radio" name="withdrawMethod" className="hidden" value="gada_token"
                     checked={method === "gada_token"} onChange={() => setMethod("gada_token")} />
              <div className="h-9 w-9 rounded-md bg-yellow-100 flex items-center justify-center">
                <Coins className="h-5 w-5 text-yellow-700" />
              </div>
              <span className="font-medium">gada token</span>
            </label>
          </div>
        </div>

        {/* Amount card (amount only) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Amount (₦)</label>
            <Input
              type="number" min={1} inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter amount" className="h-11"
            />
            <p className="text-xs text-gray-500 mt-1">
              The minimum withdrawal request amount is {`₦${MIN_WITHDRAW.toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Separate Transfer To + Submit section (full width) ===== */}
      <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-end">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Transfer To</label>
            <Input
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder={method === "bank" ? "e.g., 2027267123, Kuda Bank, Account Name" : "e.g., 0xYourTokenAddress"}
              className="h-11"
            />
          </div>

          <div className="flex md:justify-end">
            <Button type="submit" className="h-11 w-full md:w-auto" disabled={disableSubmit}>
              {submitting ? "Submitting..." : "Make a withdrawal"}
            </Button>
          </div>
        </div>
      </form>

      {/* ===== Filters for history ===== */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
            <Input type="date" value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                   max={format(new Date(), "yyyy-MM-dd")} className="h-11" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End Date</label>
            <Input type="date" value={endDate}
                   onChange={(e) => setEndDate(e.target.value)}
                   max={format(new Date(), "yyyy-MM-dd")} className="h-11" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Method</label>
            <select className="h-11 w-full border rounded-md px-3"
                    value={filterMethod} onChange={(e) => setFilterMethod(e.target.value as MethodFilter)}>
              <option value="all">All</option>
              <option value="bank">Bank</option>
              <option value="gada_token">gada token</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select className="h-11 w-full border rounded-md px-3"
                    value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}>
              <option value="all">All</option>
              <option value="0">Pending</option>
              <option value="1">Approved</option>
              <option value="-1">Declined</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Search (Transfer To)</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g., bank name / address" className="h-11" />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" className="h-11" onClick={clearFilters}>Clear</Button>
        </div>
      </div>

      {/* ===== History table ===== */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-sm font-medium mb-3">Withdrawal History</h4>
        {loadingList ? (
          <div className="flex justify-center py-10">
            <svg className="animate-spin h-6 w-6 text-gray-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : (
          <>
           {list && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transfer To</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{fmt(Number(r.amount))}</TableCell>
                    <TableCell className="capitalize">{r.method}</TableCell>
                    <TableCell className="truncate max-w-[260px]" title={r.transferTo}>{r.transferTo}</TableCell>
                    <TableCell>{new Date(r.time).toLocaleString()}</TableCell>
                    <TableCell>
                      {r.status === 1 && <span className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">Approved</span>}
                      {r.status === 0 && <span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">Pending</span>}
                      {r.status === -1 && <span className="px-2 py-1 text-xs rounded bg-rose-100 text-rose-700">Declined</span>}
                    </TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-10">
                      No withdrawal requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
           )}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button onClick={loadMore} className="h-11 px-6">Load more</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
