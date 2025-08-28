// src/pages/account/AffiliatesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Copy, Check, Share2, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { stripUploads } from "@/lib/url";

// same services you already use
import { getAffOverview, getAffReferrals, affTransfer } from "@/services/affiliateService";

// layout & UI components (same look/feel as Payments page)
import { Navbar } from "@/components/layout/Navbar";
import Sidebar from "@/components/ui/Sidebar1";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ShareStrip from "@/components/share/ShareStrip";
import { toast } from 'sonner';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

type Over = {
  settings: {
    enabled: boolean;
    levels: number;
    type: string;
    minWithdrawal: number;
    transferEnabled: boolean;
    withdrawEnabled: boolean;
  };
  shareLink: string;
  balance: { affiliate: number; wallet: number };
  referrals: { perLevel: number[]; total: number };
};

type Item = {
  id: number;
  username: string;
  fullName: string;
  avatar?: string | null;
  joinedAt?: string;
};

const initials = (n: string) =>
  (n || "?")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0]!.toUpperCase())
    .slice(0, 2)
    .join("");

const fmt = (v: number) =>
  `₦${(isNaN(v) ? 0 : v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function AffiliatesPage() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  // overview
  const [over, setOver] = useState<Over | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // list filters
  const [level, setLevel] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState("");

  // referrals payload
  const [refRows, setRefRows] = useState<{ items: Item[]; total: number } | null>(null);

  const pages = useMemo(() => {
    if (!refRows) return 1;
    return Math.max(1, Math.ceil((refRows.total || 0) / limit));
  }, [refRows, limit]);

  // load overview (once per auth)
  useEffect(() => {
    if (!accessToken) return;
    setBusy(true);
    setErr(null);
    getAffOverview(headers)
      .then(setOver)
      .catch((e) => setErr(String(e?.message || "Failed to load")))
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // load referrals whenever filters change
  useEffect(() => {
    if (!accessToken) return;
    getAffReferrals(headers, { page, limit, level, search: q })
      .then((d) => setRefRows({ items: d.items || [], total: d.total || 0 }))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, page, limit, level, q]);

  // copy link
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (!over?.shareLink) return;
    try {
      await navigator.clipboard.writeText(over.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // transfer
  const [amt, setAmt] = useState("");
  const doTransfer = async () => {
    if (!over) return;
    try {
      const n = Number(amt);
      if (!Number.isFinite(n) || n <= 0) return;
      await affTransfer(headers, n);
      // refresh balance only
      const fresh = await getAffOverview(headers);
      toast.success('Balance transfered successfully!')
      setOver(fresh);
      setAmt("");
    } catch (e: any) {
      alert(e?.message || "Transfer failed");
    }
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
            {/* Top info banner */}
            <div className="rounded-xl bg-cyan-50 text-cyan-900 border border-cyan-200 p-4">
              <div className="font-semibold">Affiliates System</div>
              <div className="text-sm opacity-90">
                Earn up to multi-level commissions when people join via your link. Earn up to {over?.settings?.level1per}% (Level 1) , {over?.settings?.level2per}% (Level 2) , {over?.settings?.level3per}% (Level 3) From the package of your refered user.
                You will be paid when new user registered & bought a package. 
                your affiliate balance to your wallet.
              </div>
            </div>

            {/* Share + Balance */}
            <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium text-sm text-gray-700">Your affiliate link</div>
                <div className="mt-2 flex items-center gap-2">
                  <Input value={over?.shareLink || ""} readOnly className="bg-gray-50" />
                  <Button variant="outline" onClick={onCopy} className="shrink-0">
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <ShareStrip
                    className="mt-3"
                    url={over?.shareLink || ""}
                    title="Join me on Gada Chat"
                    text="Sign up using my invitation link!"
                    // Uncomment & set if you want a Messenger button:
                    // fbAppId={import.meta.env.VITE_FB_APP_ID}
                    // fbRedirectUri={`${location.origin}/share-callback`}
                    />
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Affiliates Money Balance</div>
                <div className="mt-1 text-3xl font-semibold">
                  {fmt(Number(over?.balance.affiliate || 0))}
                </div>
              </div>
            </div>

            {/* Transfer to wallet */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Amount (₦)</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Enter amount"
                    value={amt}
                    onChange={(e) => setAmt(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button
                  onClick={doTransfer}
                  disabled={!over?.settings.transferEnabled || !amt || Number(amt) <= 0}
                  className="h-11 px-6 w-full sm:w-auto"
                >
                  Transfer to Wallet
                </Button>
              </div>
              {!over?.settings.transferEnabled && (
                <div className="mt-2 text-sm text-gray-500">
                  Transfers are currently disabled by admin.
                </div>
              )}
            </div>

            {/* Level counters */}
            {over && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {over.referrals.perLevel.map((v, i) => (
                  <div key={i} className="rounded-xl bg-white shadow p-4 text-center">
                    <div className="text-xs text-gray-500">Level {i + 1}</div>
                    <div className="text-xl font-semibold">{v}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters bar */}
            <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setPage(1);
                    setLimit(Number(e.target.value));
                  }}
                  className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>

                <select
                  value={level}
                  onChange={(e) => {
                    setPage(1);
                    setLevel(Number(e.target.value));
                  }}
                  className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                >
                  {Array.from({ length: Math.max(1, over?.settings.levels || 1) }).map((_, i) => (
                    <option key={i} value={i + 1}>
                      Level {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Search by name or username"
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                  className="pl-9 bg-gray-100 border-none rounded-full focus-visible:ring-[#1877F2]"
                />
              </div>
            </div>

            {/* Referrals list (fixed height w/ scroll, like your transactions table) */}
            <div className="bg-white rounded-lg shadow p-0">
              {!refRows ? (
                <div className="p-6 text-gray-500 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : refRows.items.length === 0 ? (
                <div className="p-6 text-gray-500">No referrals found</div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto pr-2">
                  <ul className="divide-y">
                    {refRows.items.map((u) => (
                      <li key={u.id} className="px-4 py-3 flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={u.avatar ? `${API_BASE_URL}/uploads/${stripUploads(u.avatar)}` : ""}
                          />
                          <AvatarFallback>{initials(u.fullName || u.username)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{u.fullName || u.username}</div>
                          <div className="text-xs text-gray-500">@{u.username}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Pagination controls (compact, consistent with your style) */}
            <div className="flex items-center justify-center gap-2 pb-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                {Math.min(page, pages)} / {pages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
