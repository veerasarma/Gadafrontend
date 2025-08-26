// src/pages/PaymentsPage.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader, useAuthHeaderupload } from "@/hooks/useAuthHeader";
import {
  fetchTransactions,
  Transaction,
  initializePayment,
  fetchBalance,
  fetchSysdetails,
} from "@/services/paymentService";
import { Navbar } from "@/components/layout/Navbar";
import Sidebar from "@/components/ui/Sidebar1";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Landmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import ManualWithdrawal from "@/components/wallet/ManualWithdrawal";

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function PaymentsPage() {
  const { user, accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headers1 = useAuthHeaderupload(accessToken);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  // pagination for wallet table
  const TX_PAGE_SIZE = 20;
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(false);
  const [txLoadingMore, setTxLoadingMore] = useState(false);

  const [balance, setBalance] = useState({
    user_wallet_balance: 0,
    user_points: 0,
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [amount, setAmount] = useState<number | "">("");
  const [sysdetails, setSysdetails] = useState<[]>([]);
  const [payLoading, setPayLoading] = useState(false);

  // Payment method (radio)
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "bank">(
    "paystack"
  );

  // Popups
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"wallet" | "payments">("wallet");

  // Bank receipt upload
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [sendingReceipt, setSendingReceipt] = useState(false);

  // --- Fees (placeholder – make dynamic later) ---
  const VAT_PERCENT = Number(sysdetails?.payment_vat_percentage || 2); // %
  const FEES_PERCENT = Number(sysdetails?.payment_fees_percentage || 6); // %
  const baseAmount = Number(amount || 0);
  const vat = useMemo(
    () => +(baseAmount * (VAT_PERCENT / 100)).toFixed(2),
    [baseAmount]
  );
  const fees = useMemo(
    () => +(baseAmount * (FEES_PERCENT / 100)).toFixed(2),
    [baseAmount]
  );
  const total = useMemo(
    () => +(baseAmount + vat + fees).toFixed(2),
    [baseAmount, vat, fees]
  );

  // ======== data loaders ========
  const loadTxFirstPage = async () => {
    if (!accessToken) return;
    setLoadingTx(true);
    try {
      const resp = await fetchTransactions(headers, {
        page: 1,
        pageSize: TX_PAGE_SIZE,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setTransactions(resp.data);
      setTxPage(resp.page);
      setTxHasMore(resp.hasMore);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load transactions");
    } finally {
      setLoadingTx(false);
    }
  };

  const loadMoreTx = async () => {
    if (!txHasMore || txLoadingMore) return;
    setTxLoadingMore(true);
    try {
      const resp = await fetchTransactions(headers, {
        page: txPage + 1,
        pageSize: TX_PAGE_SIZE,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setTransactions((prev) => [...prev, ...resp.data]);
      setTxPage(resp.page);
      setTxHasMore(resp.hasMore);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load more");
    } finally {
      setTxLoadingMore(false);
    }
  };

  // initial load
  useEffect(() => {
    if (!accessToken) return;
    loadTxFirstPage();
    fetchBalance(headers).then(setBalance).catch(console.error);
    fetchSysdetails(headers).then(setSysdetails).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // refetch on filter change
  useEffect(() => {
    loadTxFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // Currency fmt
  const fmt = (v: number) =>
    `₦${(isNaN(v) ? 0 : v).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;

  // Click "Pay ₦" -> open Fee modal
  const handleOpenFeeModal = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setShowFeeModal(true);
  };

  // Continue from Fee modal
  const handleFeeContinue = async () => {
    const chargeAmount = total;

    if (paymentMethod === "bank") {
      setShowFeeModal(false);
      setShowBankModal(true);
      return;
    }

    if (!user?.email) return;
    setPayLoading(true);
    try {
      const { authorization_url, reference } = await initializePayment(
        user.email,
        chargeAmount,
        { userId: user.id, method: "paystack", baseAmount }
      );

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: Math.round(chargeAmount * 100),
        reference,
        callback: () => {
          setStartDate("");
          setEndDate("");
          loadTxFirstPage();
        },
        onClose: () => {},
      });
      handler.openIframe();
    } catch (err) {
      console.error(err);
      alert("Could not initiate Paystack payment");
    } finally {
      setPayLoading(false);
      setShowFeeModal(false);
    }
  };

  // Upload bank receipt
  const handleSendBankReceipt = async () => {
    if (!user || !receiptFile) return;
    setSendingReceipt(true);
    try {
      const fd = new FormData();
      fd.append("userId", String(user.id));
      fd.append("amount", String(total));
      fd.append("baseAmount", String(baseAmount));
      fd.append("vat", String(vat));
      fd.append("fees", String(fees));
      fd.append("method", "bank");
      fd.append("receipt", receiptFile);

      await fetch(API_BASE_URL + "/api/payments/bank-transfer/receipt", {
        method: "POST",
        headers: { ...headers1 },
        body: fd,
      });
      toast.success("Receipt submitted. We’ll verify within 48 hours.");
      setReceiptFile(null);
      setShowBankModal(false);
      setAmount("");
      loadTxFirstPage();
      fetchBalance(headers).then(setBalance).catch(console.error);
    } catch (e) {
      console.error(e);
      alert("Failed to submit receipt. Please try again.");
    } finally {
      setSendingReceipt(false);
    }
  };

  // Static bank details (replace with dynamic later)
  const bank = {
    bank_name: sysdetails?.bank_name || "moniepoint MFB",
    account_number: sysdetails?.bank_account_number || "5329604228",
    account_name:
      sysdetails?.bank_account_name || "mega fruitful vine services limited",
    country: sysdetails?.bank_account_country || "nigeria",
  };

  return (
    <div className="flex flex-col min-h-screen bg-cus">
      <Navbar />

      <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto">
            <Sidebar />
          </aside>

          {/* MAIN */}
          <main className="flex-1 flex flex-col overflow-y-auto space-y-6">
            {/* Tabs */}
            <div className="bg-white">
              <nav className="flex gap-8 px-6">
                <button
                  type="button"
                  className={`py-4 border-b-2 font-medium ${
                    activeTab === "wallet"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-600 hover:text-gray-900 border-transparent"
                  }`}
                  onClick={() => setActiveTab("wallet")}
                >
                  Wallet
                </button>

                <button
                  type="button"
                  className={`py-4 border-b-2 font-medium ${
                    activeTab === "payments"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-600 hover:text-gray-900 border-transparent"
                  }`}
                  onClick={() => setActiveTab("payments")}
                >
                  Payments
                </button>
              </nav>
            </div>

            {/* ===== WALLET TAB ===== */}
            {activeTab === "wallet" && (
              <>
                {/* Balance + Payment Method + Checkout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Your Credit */}
                  <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Your Credit</p>
                      <p className="text-2xl font-semibold">
                        {fmt(balance.user_wallet_balance)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <label className="block text-sm text-gray-600 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors
                        ${
                          paymentMethod === "paystack"
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          className="hidden"
                          value="paystack"
                          checked={paymentMethod === "paystack"}
                          onChange={() => setPaymentMethod("paystack")}
                        />
                        <div className="h-9 w-9 rounded-md bg-sky-100 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-sky-600" />
                        </div>
                        <span className="font-medium">Paystack</span>
                      </label>

                      <label
                        className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors
                        ${
                          paymentMethod === "bank"
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          className="hidden"
                          value="bank"
                          checked={paymentMethod === "bank"}
                          onChange={() => setPaymentMethod("bank")}
                        />
                        <div className="h-9 w-9 rounded-md bg-emerald-100 flex items-center justify-center">
                          <Landmark className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="font-medium">Bank Transfer</span>
                      </label>
                    </div>
                  </div>

                  {/* Amount + Pay */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <form
                      onSubmit={handleOpenFeeModal}
                      className="flex flex-col sm:flex-row gap-3 sm:items-end"
                    >
                      <div className="flex-1">
                        <label
                          htmlFor="amount"
                          className="block text-sm text-gray-600 mb-1"
                        >
                          Amount (₦)
                        </label>
                        <Input
                          id="amount"
                          type="number"
                          min="1"
                          inputMode="numeric"
                          value={amount}
                          onChange={(e) =>
                            setAmount(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          placeholder="Enter amount"
                          className="h-11"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={payLoading || !amount || Number(amount) <= 0}
                        className="h-11 px-6 w-full sm:w-auto"
                      >
                        {payLoading ? "Processing…" : "Pay ₦"}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:items-end">
                    <div>
                      <label
                        htmlFor="startDate"
                        className="block text-sm text-gray-600 mb-1"
                      >
                        Start Date
                      </label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={format(new Date(), "yyyy-MM-dd")}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="endDate"
                        className="block text-sm text-gray-600 mb-1"
                      >
                        End Date
                      </label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        max={format(new Date(), "yyyy-MM-dd")}
                        className="h-11"
                      />
                    </div>
                    <div className="flex sm:justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                        }}
                        className="h-11 w-full sm:w-auto"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Transactions */}
                <div className="bg-white rounded-lg shadow p-6">
                  {loadingTx ? (
                    <div className="flex justify-center py-10">
                      <svg
                        className="animate-spin h-6 w-6 text-gray-500"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <>
                      {/* Fixed-height scrollable table so page doesn't jump */}
                      <div className="max-h-[420px] overflow-y-auto pr-2">
                        <Table>
                          <TableHeader className="sticky top-0 bg-white">
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">
                                Amount (₦)
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.map((tx) => (
                              <TableRow key={tx.id}>
                                <TableCell>
                                  {format(new Date(tx.createdAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="capitalize">
                                  {tx.type}
                                </TableCell>
                                <TableCell className="text-right">
                                  {tx.amount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}

                            {transactions.length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  className="text-center text-gray-500 py-10"
                                >
                                  No transactions found.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Load more button (doesn't change page height) */}
                      {txHasMore && (
                        <div className="flex justify-center mt-4">
                          <Button
                            onClick={loadMoreTx}
                            disabled={txLoadingMore}
                            className="h-11 px-6"
                          >
                            {txLoadingMore ? "Loading..." : "Load more"}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* ===== PAYMENTS TAB ===== */}
            {activeTab === "payments" && (
              <ManualWithdrawal
                headers={headers}
                balance={balance.user_wallet_balance}
                refreshBalance={() =>
                  fetchBalance(headers).then(setBalance).catch(console.error)
                }
              />
            )}
          </main>
        </div>
      </div>

      {/* -------- Popup 1: Fee breakdown -------- */}
      <Dialog open={showFeeModal} onOpenChange={setShowFeeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Amount</span>
              <span>{baseAmount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT +%{VAT_PERCENT}</span>
              <span>{vat}</span>
            </div>
            <div className="flex justify-between">
              <span>Fees +%{FEES_PERCENT}</span>
              <span>{fees}</span>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-gray-900">{fmt(total)}</span>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="secondary" onClick={() => setShowFeeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleFeeContinue} disabled={payLoading}>
              {paymentMethod === "paystack" ? "Continue" : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------- Popup 2: Bank Transfer -------- */}
      <Dialog open={showBankModal} onOpenChange={setShowBankModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" /> Bank Transfer
            </DialogTitle>
          </DialogHeader>

          {/* Bank card */}
          <div className="rounded-xl border bg-gradient-to-b from-blue-600 to-blue-500 text-white p-6">
            <div className="text-xl font-semibold">{bank.bank_name}</div>
            <div className="mt-4 text-2xl tracking-wide">{bank.account_number}</div>
            <div className="mt-1 capitalize">{bank.account_name}</div>
            <div className="mt-1 uppercase text-white/80">{bank.country}</div>
            <div className="mt-4 text-white/90">
              Amount to pay: <span className="font-semibold">{fmt(total)}</span>
            </div>
          </div>

          {/* Notice */}
          <div className="mt-4 rounded-md bg-orange-50 border border-orange-200 p-4 text-sm text-orange-800">
            In order to confirm the bank transfer, you will need to upload a receipt
            (or a screenshot) within <strong>1 day</strong> from your payment date.
            We will verify and confirm within <strong>48 hours</strong> after upload.
          </div>

          {/* Receipt upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Bank Receipt</label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {receiptFile && (
                <span className="text-sm text-gray-600">{receiptFile.name}</span>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="secondary" onClick={() => setShowBankModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendBankReceipt}
              disabled={!receiptFile || sendingReceipt}
            >
              {sendingReceipt ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
