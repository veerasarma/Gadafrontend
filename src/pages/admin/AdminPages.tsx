// src/pages/admin/AdminPages.tsx
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { toast } from 'sonner';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

/* ----- small metric card (same pattern as AdminPosts) ----- */
function StatCard({ label, value, gradient }: { label: string; value: number | string; gradient: string }) {
  return (
    <div className={`rounded-3xl p-6 text-white shadow-sm bg-gradient-to-r ${gradient} relative overflow-hidden`}>
      <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="mt-2 text-xl opacity-95">{label}</div>
      <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/15 pointer-events-none" />
    </div>
  );
}

/* ---------- types ---------- */
type PageRow = {
  id: string;
  handle: string;
  title: string;
  picture?: string | null;
  cover?: string | null;
  likes: number;
  verified: boolean;
  adminName: string;
  createdAt: string;
};

type PageStats = {
  totalPages: number;
  verifiedPages: number;
  totalLikes: number;
};

export default function AdminPages() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => 'Authorization' in headers, [headers]);

  // list state
  const [rows, setRows] = useState<PageRow[]>([]);
  const [status, setStatus] = useState<'all'|'verified'|'unverified'>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // metrics
  const [stats, setStats] = useState<PageStats>({ totalPages: 0, verifiedPages: 0, totalLikes: 0 });

  const fetchStats = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/admin/pages/metrics`, { headers });
      if (!r.ok) throw new Error('Metrics failed');
      const s = await r.json();
      setStats({
        totalPages: Number(s.totalPages || 0),
        verifiedPages: Number(s.verifiedPages || 0),
        totalLikes: Number(s.totalLikes || 0),
      });
    } catch (e:any) {
      console.warn('[admin pages] metrics load failed:', e?.message);
    }
  };

  const load = async () => {
    try {
      const params = new URLSearchParams({
        status, search: q, page: String(page), limit: String(limit),
      });
      const r = await fetch(`${API_BASE_URL}/api/admin/pages?${params}`, { headers });
      if (!r.ok) throw new Error('Load failed');
      const data = await r.json();
      setRows(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setHasPrev(!!data.hasPrev);
      setHasNext(!!data.hasNext);
    } catch (e:any) {
      toast.error('Load failed', { description: e?.message });
    }
  };

  function formatDate(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d as any) ? String(iso) : d.toLocaleString();
  }

  useEffect(() => { if (ready) fetchStats(); }, [ready]);
  useEffect(() => { if (ready) load(); }, [ready, status, page, limit]);

  // actions
  const toggleVerify = async (row: PageRow) => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/admin/pages/${row.id}/verify`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !row.verified })
      });
      if (!r.ok) throw new Error('Verify failed');
      toast.success(!row.verified ? 'Page verified' : 'Page unverified');
      load();
      fetchStats();
    } catch (e:any) {
      toast.error('Failed', { description: e?.message });
    }
  };

  const removePage = async (row: PageRow) => {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    try {
      const r = await fetch(`${API_BASE_URL}/api/admin/pages/${row.id}`, {
        method: 'DELETE',
        headers
      });
      if (!r.ok) throw new Error('Delete failed');
      toast.success('Page deleted');
      load();
      fetchStats();
    } catch (e:any) {
      toast.error('Failed', { description: e?.message });
    }
  };

  // pagination window
  function pageWindow(curr: number, total: number) {
    const out:(number|'…')[] = [];
    if (total <= 7) { for (let i=1;i<=total;i++) out.push(i); return out; }
    out.push(1);
    if (curr > 3) out.push('…');
    for (let i=Math.max(2, curr-1); i<=Math.min(total-1, curr+1); i++) out.push(i);
    if (curr < total-2) out.push('…');
    out.push(total);
    return out;
  }
  const pages = pageWindow(page, totalPages);

  const img = (p?: string|null) => p ? `${API_BASE_URL}/uploads/${p}` : `${API_BASE_URL}/uploads//profile/defaultavatar.png`;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <StatCard label="Pages"          value={stats.totalPages}    gradient="from-fuchsia-600 to-purple-500" />
        <StatCard label="Verified Pages" value={stats.verifiedPages} gradient="from-violet-500 to-indigo-500" />
        <StatCard label="Total Likes"    value={stats.totalLikes}    gradient="from-sky-500 to-blue-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={status} onValueChange={(v)=>{setPage(1); setStatus(v as any);}}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Search title/handle"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onKeyDown={(e)=>e.key==='Enter' && (setPage(1), load())}
            className="w-full sm:w-64"
          />
          <Button onClick={()=>{ setPage(1); load(); }}>Search</Button>

          <Select value={String(limit)} onValueChange={(v)=>{ setPage(1); setLimit(Number(v)); }}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Page size" /></SelectTrigger>
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
              <TableHead>Page</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Likes</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Datetime</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={img(r.picture)} className="h-8 w-8 rounded-full object-cover bg-gray-100" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.title}</div>
                      <div className="text-xs text-gray-500 truncate">@{r.handle}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{r.adminName || '-'}</TableCell>
                <TableCell>{r.likes}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {r.verified ? 'Yes' : 'No'}
                  </span>
                </TableCell>
                <TableCell>
                  <Link to={`/pages/${r.handle}`} target="_blank" className="text-blue-600 hover:underline">View</Link>
                </TableCell>
                <TableCell>{formatDate(r.createdAt)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={()=>toggleVerify(r)}>
                    {r.verified ? 'Unverify' : 'Verify'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={()=>removePage(r)}>
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {(rows.length ? (page - 1) * limit + 1 : 0)}–{(page - 1) * limit + rows.length} of {total}
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink onClick={()=>setPage(1)} aria-disabled={page===1} className={page===1 ? 'pointer-events-none opacity-50' : ''}>
                First
              </PaginationLink>
            </PaginationItem>

            <PaginationItem>
              <PaginationPrevious onClick={()=>setPage(p=>Math.max(1,p-1))} className={hasPrev ? '' : 'pointer-events-none opacity-50'} />
            </PaginationItem>

            {pageWindow(page, totalPages).map((p, i) =>
              p === '…' ? (
                <PaginationItem key={`e-${i}`}><span className="px-2 text-gray-400">…</span></PaginationItem>
              ) : (
                <PaginationItem key={p as number}>
                  <PaginationLink isActive={p===page} onClick={()=>setPage(p as number)}>{p}</PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className={hasNext ? '' : 'pointer-events-none opacity-50'} />
            </PaginationItem>

            <PaginationItem>
              <PaginationLink onClick={()=>setPage(totalPages)} aria-disabled={page===totalPages} className={page===totalPages ? 'pointer-events-none opacity-50' : ''}>
                Last
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
