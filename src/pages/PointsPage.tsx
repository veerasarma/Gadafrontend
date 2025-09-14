// import { useMemo, useState } from 'react';
// import { Navbar } from '@/components/layout/Navbar';
// import Sidebar from '@/components/ui/Sidebar1';
// // import { AccountSidebarMini } from '@/components/settings/AccountSidebarMini';
// import { Card, CardContent } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Coins, MessageSquare, Eye, UserPlus, RefreshCw, Wallet, Info } from 'lucide-react';

// /* ------------------------------ Static Data ------------------------------ */

// type RuleCard = {
//   title: string;
//   subtitle: string;
//   points: number;
//   icon: 'post' | 'view' | 'comment' | 'follow' | 'refer' | 'transfer';
// };

// const RULES: RuleCard[] = [
//   { title: 'Points', subtitle: 'For creating a new post', points: 10, icon: 'post' },
//   { title: 'Points', subtitle: 'For each post view', points: 1, icon: 'view' },
//   { title: 'Points', subtitle: 'For any comment on your post', points: 5, icon: 'comment' },
//   { title: 'Points', subtitle: 'For each follower you got', points: 5, icon: 'follow' },
//   { title: 'Points', subtitle: 'For referring user', points: 5, icon: 'refer' },
// ];

// const BALANCE = {
//   points: 15296.5,
//   money: 1529.65, // NGN
// };

// type Txn = { id: number; points: number; from: string; time: string };
// const TXNS: Txn[] = Array.from({ length: 50 }).map((_, i) => ({
//   id: i + 1,
//   points: i % 10 === 2 ? 10 : 1,
//   from: i % 10 === 2 ? 'Added Post' : 'Post View',
//   time: i < 10 ? 'a day ago' : `${Math.floor(i / 6) + 2} days ago`,
// }));

// /* --------------------------- Small UI Helpers ---------------------------- */

// function RuleIcon({ type }: { type: RuleCard['icon'] }) {
//   const common = 'h-5 w-5';
//   switch (type) {
//     case 'post':
//       return <Coins className={common} />;
//     case 'view':
//       return <Eye className={common} />;
//     case 'comment':
//       return <MessageSquare className={common} />;
//     case 'follow':
//       return <UserPlus className={common} />;
//     case 'refer':
//       return <RefreshCw className={common} />;
//     case 'transfer':
//       return <Wallet className={common} />;
//   }
// }

// /* --------------------------------- Page --------------------------------- */

// export default function PointsPage() {
//   const [pageSize, setPageSize] = useState(10);
//   const [page, setPage] = useState(1);
//   const [q, setQ] = useState('');

//   const filtered = useMemo(() => {
//     const term = q.trim().toLowerCase();
//     if (!term) return TXNS;
//     return TXNS.filter(
//       (t) =>
//         String(t.id).includes(term) ||
//         String(t.points).includes(term) ||
//         t.from.toLowerCase().includes(term) ||
//         t.time.toLowerCase().includes(term)
//     );
//   }, [q]);

//   const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const current = Math.min(page, totalPages);
//   const start = (current - 1) * pageSize;
//   const pageData = filtered.slice(start, start + pageSize);

//   return (
//     <div className="flex flex-col min-h-screen bg-cus">
//     <Navbar />

//     <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
//       <div className="flex flex-1 max-w-[1600px] w-full mx-auto gap-6">
//         {/* LEFT SIDEBAR */}
//         <aside className="hidden lg:block lg:w-1/5">
//           <div className="sticky ">
//             <Sidebar />
//           </div>
//         </aside>

//         {/* MAIN */}
//         <main className="flex-1 flex flex-col overflow-y-auto space-y-6">
//           {/* Info banner */}
//           <Card className="mb-6 overflow-hidden">
//                 <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 p-4 text-white">
//                   <div className="flex items-start gap-3">
//                     <div className="bg-white/20 rounded-md p-2">
//                       <Info className="h-5 w-5" />
//                     </div>
//                     <div className="space-y-1 text-sm leading-6">
//                       <div className="font-semibold">Points System</div>
//                       <div>Each 10 points equal ₦1.</div>
//                       <div>Your daily points limit is <b>5000</b> points. You have <b>600</b> remaining points.</div>
//                       <div>Your daily points limit will reset after 24 hours from your last valid earned action.</div>
//                       <div>You can transfer your money to your wallet.</div>
//                     </div>
//                   </div>
//                 </div>
//               </Card>

//               {/* Rules cards */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
//                 {RULES.map((r, i) => (
//                   <Card key={i}>
//                     <CardContent className="p-4 flex items-start justify-between">
//                       <div>
//                         <div className="text-3xl font-bold">{r.points}</div>
//                         <div className="text-sm text-gray-500">{r.title}</div>
//                         <div className="mt-2 text-gray-700 text-sm">{r.subtitle}</div>
//                       </div>
//                       <div className="rounded-full bg-gray-100 p-2 text-gray-600">
//                         <RuleIcon type={r.icon} />
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}

//                 {/* Refer/Transfer example (optional extra) */}
//                 <Card>
//                   <CardContent className="p-4 flex items-start justify-between">
//                     <div>
//                       <div className="text-3xl font-bold">↔</div>
//                       <div className="text-sm text-gray-500">Transfer</div>
//                       <div className="mt-2 text-gray-700 text-sm">Transfer points to wallet</div>
//                     </div>
//                     <div className="rounded-full bg-gray-100 p-2 text-gray-600">
//                       <RuleIcon type="transfer" />
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>

//               {/* Balances */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                 <Card className="overflow-hidden">
//                   <div className="bg-gradient-to-r from-sky-500 to-indigo-500 p-5 text-white">
//                     <div className="text-sm/6 opacity-90">Points Balance</div>
//                     <div className="mt-2 text-2xl font-semibold">{BALANCE.points.toLocaleString()} Points</div>
//                   </div>
//                 </Card>
//                 <Card className="overflow-hidden">
//                   <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
//                     <div className="text-sm/6 opacity-90">Points Money Balance</div>
//                     <div className="mt-2 text-2xl font-semibold">₦{BALANCE.money.toLocaleString()}</div>
//                   </div>
//                 </Card>
//               </div>

//               {/* Transactions */}
//               <Card>
//                 <CardContent className="p-4 md:p-6">
//                   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
//                     <div className="text-sm font-semibold text-gray-700">Points Transactions</div>
//                     <div className="flex items-center gap-3">
//                       <div className="flex items-center gap-2">
//                         <span className="text-sm text-gray-600">Show</span>
//                         <Select
//                           value={String(pageSize)}
//                           onValueChange={(v) => {
//                             setPageSize(Number(v));
//                             setPage(1);
//                           }}
//                         >
//                           <SelectTrigger className="h-8 w-16">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {[10, 20, 50].map((n) => (
//                               <SelectItem key={n} value={String(n)}>
//                                 {n}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         <span className="text-sm text-gray-600">entries</span>
//                       </div>
//                       <div className="w-56">
//                         <Input
//                           placeholder="Search…"
//                           value={q}
//                           onChange={(e) => {
//                             setQ(e.target.value);
//                             setPage(1);
//                           }}
//                           className="h-9"
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   <div className="overflow-x-auto">
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           <TableHead>ID</TableHead>
//                           <TableHead className="whitespace-nowrap">Points</TableHead>
//                           <TableHead>From</TableHead>
//                           <TableHead>Time</TableHead>
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {pageData.map((t) => (
//                           <TableRow key={t.id}>
//                             <TableCell className="font-medium">{t.id}</TableCell>
//                             <TableCell>{t.points}</TableCell>
//                             <TableCell>{t.from}</TableCell>
//                             <TableCell>{t.time}</TableCell>
//                           </TableRow>
//                         ))}
//                         {pageData.length === 0 && (
//                           <TableRow>
//                             <TableCell colSpan={4} className="text-center text-gray-500">
//                               No transactions found.
//                             </TableCell>
//                           </TableRow>
//                         )}
//                       </TableBody>
//                     </Table>
//                   </div>

//                   {/* Pagination */}
//                   <div className="mt-4 flex items-center justify-end gap-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => setPage(1)}
//                       disabled={current === 1}
//                     >
//                       First
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => setPage((p) => Math.max(1, p - 1))}
//                       disabled={current === 1}
//                     >
//                       Previous
//                     </Button>
//                     <span className="text-sm text-gray-600">
//                       Page <b>{current}</b> of <b>{totalPages}</b>
//                     </span>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                       disabled={current === totalPages}
//                     >
//                       Next
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => setPage(totalPages)}
//                       disabled={current === totalPages}
//                     >
//                       Last
//                     </Button>
//                   </div>

//                   <div className="mt-2 text-xs text-gray-500">
//                     Showing {pageData.length ? start + 1 : 0} to {start + pageData.length} of {filtered.length} entries
//                   </div>
//                 </CardContent>
//               </Card>
//         </main>
//       </div>
//     </div>
//   </div>
//   );
// }

// src/pages/points/PointsPage.tsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coins, MessageSquare, Eye, UserPlus, RefreshCw, Wallet, Info,Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { getPointsOverview, getPointsLogs, type PointsOverview, type PointsRow } from '@/services/pointsService';

function RuleIcon({ type }: { type: 'post' | 'view' | 'comment' | 'follow' | 'refer' | 'transfer' }) {
  const c = 'h-5 w-5';
  switch (type) {
    case 'post': return <Coins className={c} />;
    case 'view': return <Eye className={c} />;
    case 'comment': return <MessageSquare className={c} />;
    case 'follow': return <UserPlus className={c} />;
    case 'refer': return <RefreshCw className={c} />;
    case 'transfer': return <Wallet className={c} />;
  }
}

export default function PointsPage() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const logsReqIdRef = useRef(0);
  const logsSeq = useRef(0);

  function useDebounced<T>(value: T, ms = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setV(value), ms);
      return () => clearTimeout(t);
    }, [value, ms]);
    return v;
  }


  const [loading, setLoading] = useState(true);
  const [ov, setOv] = useState<PointsOverview | null>(null);

  // table paging/search state
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<PointsRow[]>([]);
  const [total, setTotal] = useState(0);
// stable key for auth; avoids re-running on object identity changes
const authKey = accessToken || '';
const debouncedQ = useDebounced(q, 350);

const [pts, setPts] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const ppc = ov?.rules.conversion.pointsPerNaira ?? 10; // “Each X points equal ₦1”
  const transferEnabled = !!ov?.rules.conversion.enabled;
  const moneyPreview = typeof pts === 'number' && pts > 0 ? Math.floor((pts / ppc) * 100) / 100 : 0;



// Overview (exactly once per token)
const didInitOverview = useRef(false);
useEffect(() => {
  if (!authKey) return;
  if (didInitOverview.current) return;
  didInitOverview.current = true;

  const ac = new AbortController();
  (async () => {
    try {
      setLoading(true);
      const overview = await getPointsOverview(headers, { signal: ac.signal });
      setOv(overview);
    } catch (e) {
      if ((e as any)?.name !== 'AbortError') console.error(e);
    } finally {
      setLoading(false);
    }
  })();
  return () => ac.abort();
}, [authKey]);

// Logs (latest wins)
useEffect(() => {
  if (!authKey) return;
  const seq = ++logsSeq.current;
  const ac = new AbortController();
  setLoading(true);
  (async () => {
    try {
      const res = await getPointsLogs(headers, { page, limit: pageSize, q: debouncedQ, sort: 'time', dir: 'desc', signal: ac.signal });
      setRows(res.rows);
      setTotal(res.total);
      if (res.page !== page) setPage(res.page);
    } catch (e) {
      if ((e as any)?.name !== 'AbortError') console.error(e);
    } finally {
      if (logsSeq.current === seq) setLoading(false);
    }
  })();
  return () => ac.abort();
}, [authKey, page, pageSize, debouncedQ]);

const totalPages = Math.max(1, Math.ceil(total / pageSize));
const current = Math.min(page, totalPages);

const RULES = useMemo(() => {
  if (!ov) return [];
  return [
    { title: 'Points', subtitle: 'For creating a new post', points: ov.rules.post_create, icon: 'post' as const },
    { title: 'Points', subtitle: 'For each post view', points: ov.rules.post_view, icon: 'view' as const },
    { title: 'Points', subtitle: 'For any comment on your post', points: ov.rules.post_comment, icon: 'comment' as const },
    { title: 'Points', subtitle: 'For each follower you got', points: ov.rules.follow, icon: 'follow' as const },
    { title: 'Points', subtitle: 'For referring user', points: ov.rules.refer, icon: 'refer' as const },
  ];
}, [ov]);

// NEW: submit transfer
const onTransfer = async () => {
  if (!ov) return;
  const amt = typeof pts === 'number' ? pts : 0;
  if (amt <= 0) return toast.error('Enter points amount');
  if (!transferEnabled) return toast.error('Transfer is currently disabled');
  if (amt > ov.balances.points) return toast.error('Insufficient points');

  setSubmitting(true);
  try {
    // call backend directly (keeps change localized to this page)
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085'}/api/points/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers as any) },
      body: JSON.stringify({ points: amt }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) throw new Error(data?.error || 'Transfer failed');

    toast.success(`Transferred ${amt} points → ₦${data.moved.money}`);
    // refresh overview balances
    const fresh = await getPointsOverview(headers);
    setOv(fresh);
    setPts('');
  } catch (e: any) {
    toast.error(e?.message || 'Transfer failed');
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="flex flex-col min-h-screen bg-cus">
      <Navbar />
      <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:w-1/5">
            <div className="sticky">
              <Sidebar />
            </div>
          </aside>

          {/* MAIN */}
          <main className="flex-1 flex flex-col overflow-y-auto space-y-6">
            {/* Info banner */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 p-4 text-white">
                <div className="flex items-start gap-3">
                  <div className="bg-white/20 rounded-md p-2"><Info className="h-5 w-5" /></div>
                  <div className="space-y-1 text-sm leading-6">
                    <div className="font-semibold">Points System</div>
                    <div>
                      Each <b>{ppc}</b> points equal ₦1.
                      {ov && <span className="ml-2">Daily limit: <b>{ov.rules.daily_limit}</b> • Remaining today: <b>{ov.remainingToday}</b></span>}
                    </div>
                    <div>Your daily points limit resets {ov ? `~ every ${ov.windowHours}h` : 'daily'} after your last valid earn.</div>
                    <div>You can transfer your money to your wallet.</div>
                  </div>
                </div>
              </div>
            </Card>

               {/* Balances */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-sky-500 to-indigo-500 p-5 text-white">
                  <div className="text-sm/6 opacity-90">Points Balance</div>
                  <div className="mt-2 text-2xl font-semibold">
                    {ov ? ov.balances.points.toLocaleString() : '—'} Points
                  </div>
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
                  <div className="text-sm/6 opacity-90">Wallet Balance</div>
                  <div className="mt-2 text-2xl font-semibold">
                    ₦{ov ? ov.balances.money.toLocaleString() : '—'}
                  </div>
                </div>
              </Card>
            </div>

            {/* Rule cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {RULES.map((r, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-start justify-between">
                    <div>
                      <div className="text-3xl font-bold">{r.points}</div>
                      <div className="text-sm text-gray-500">Points</div>
                      <div className="mt-2 text-gray-700 text-sm">{r.subtitle}</div>
                    </div>
                    <div className="rounded-full bg-gray-100 p-2 text-gray-600"><RuleIcon type={r.icon} /></div>
                  </CardContent>
                </Card>
              ))}
              {/* Optional transfer card */}
             {/* NEW: Transfer card */}
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label className="text-sm text-gray-600 block mb-1">Points to convert</label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={pts}
                    onChange={(e) => setPts(e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))))}
                    placeholder="e.g. 100"
                    className="max-w-xs"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Preview: ₦{moneyPreview} &nbsp;•&nbsp; Rate: {ppc} pts = ₦1
                  </div>
                  {!transferEnabled && <div className="text-xs text-red-600 mt-1">Transfers are currently disabled.</div>}
                </div>
                <div>
                  <Button disabled={!transferEnabled || submitting || !pts || (ov ? (Number(pts) > ov.balances.points) : true)} onClick={onTransfer}>
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Transferring…</> : 'Transfer to Wallet'}
                  </Button>
                  {ov && pts && Number(pts) > ov.balances.points && (
                    <div className="text-xs text-red-600 mt-2">Insufficient points</div>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-sky-500 to-indigo-500 p-5 text-white">
                  <div className="text-sm/6 opacity-90">Points Balance</div>
                  <div className="mt-2 text-2xl font-semibold">
                    {ov ? ov.balances.points.toLocaleString() : '—'} Points
                  </div>
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
                  <div className="text-sm/6 opacity-90">Points Money Balance</div>
                  <div className="mt-2 text-2xl font-semibold">
                    ₦{ov ? ov.balances.money.toLocaleString() : '—'}
                  </div>
                </div>
              </Card>
            </div>

            {/* Transactions */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div className="text-sm font-semibold text-gray-700">Points Transactions</div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Show</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(v) => {
                          setPageSize(Number(v));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[10, 20, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600">entries</span>
                    </div>
                    <div className="w-56">
                      <Input
                        placeholder="Search…"
                        value={q}
                        onChange={(e) => { setQ(e.target.value); setPage(1); }}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.id}</TableCell>
                          <TableCell>{t.points}</TableCell>
                          <TableCell>{t.from}</TableCell>
                          <TableCell>{new Date(t.time).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {!rows.length && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500">
                            {loading ? 'Loading…' : 'No transactions found.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={current === 1}>First</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={current === 1}>Previous</Button>
                  <span className="text-sm text-gray-600">Page <b>{current}</b> of <b>{Math.max(1, Math.ceil(total / pageSize))}</b></span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={current >= totalPages}>Next</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={current >= totalPages}>Last</Button>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Showing {rows.length ? (current - 1) * pageSize + 1 : 0} to {(current - 1) * pageSize + rows.length} of {total} entries
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

