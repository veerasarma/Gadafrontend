// src/pages/admin/AdminGroups.tsx
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/pages/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

/* -------- Types -------- */
type GroupRow = {
  id: number;
  title: string;
  slug?: string | null;
  adminUsername?: string | null;
  privacy: 'public'|'closed'|'secret'|string;
  membersCount: number;
  createdAt?: string | null;
};

type GroupStats = {
  totalGroups: number;
  publicGroups: number;
  closedGroups: number;
  secretGroups: number;
  totalMembers: number;
};

/* ---- KPI Card (same style as AdminPosts) ---- */
function StatCard({ label, value, gradient }: { label: string; value: number|string; gradient: string }) {
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

export default function AdminGroups() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => 'Authorization' in headers, [headers]);

  // list state
  const [rows, setRows] = useState<GroupRow[]>([]);
  const [q, setQ] = useState('');
  const [privacy, setPrivacy] = useState<'all'|'public'|'closed'|'secret'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // meta
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // stats
  const [stats, setStats] = useState<GroupStats>({
    totalGroups: 0,
    publicGroups: 0,
    closedGroups: 0,
    secretGroups: 0,
    totalMembers: 0,
  });

  const fetchStats = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/admin/groups/metrics`, { headers });
      if (!r.ok) throw new Error('Failed to load metrics');
      const s = await r.json();
      setStats({
        totalGroups: Number(s.totalGroups || 0),
        publicGroups: Number(s.publicGroups || 0),
        closedGroups: Number(s.closedGroups || 0),
        secretGroups: Number(s.secretGroups || 0),
        totalMembers: Number(s.totalMembers || 0),
      });
    } catch (e:any) {
      console.warn('[admin groups] metrics failed:', e?.message);
    }
  };

  const load = async () => {
    try {
      const params = new URLSearchParams({
        search: q,
        privacy,
        page: String(page),
        limit: String(limit),
      });
      const r = await fetch(`${API_BASE_URL}/api/admin/groups?${params.toString()}`, { headers });
      if (!r.ok) throw new Error('Failed to load groups');
      const data = await r.json();
      setRows(data.items || []);
      setTotal(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 1));
      setHasPrev(!!data.hasPrev); setHasNext(!!data.hasNext);
    } catch (e:any) {
      toast.error('Load failed', { description: e?.message });
    }
  };

  useEffect(() => { if (ready) fetchStats(); }, [ready]);
  useEffect(() => { if (ready) load(); }, [ready, privacy, page, limit]);

  const remove = async (id: number) => {
    if (!window.confirm('Delete this group permanently? This cannot be undone.')) return;
    try {
      const r = await fetch(`${API_BASE_URL}/api/admin/groups/${id}`, { method: 'DELETE', headers });
      if (!r.ok) throw new Error('Delete failed');
      toast.success('Group deleted');
      load();
      fetchStats();
    } catch (e:any) {
      toast.error('Failed', { description: e?.message });
    }
  };

  const fmt = (iso?: string|null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d as any) ? String(iso) : d.toLocaleString();
  };

  // small pagination helper
  function pageWindow(curr: number, tot: number) {
    const out: (number|'…')[] = [];
    const push = (v:number|'…') => out.push(v);
    if (tot <= 7) { for (let i=1;i<=tot;i++) push(i); return out; }
    push(1); if (curr > 3) push('…');
    const s = Math.max(2, curr-1), e = Math.min(tot-1, curr+1);
    for (let i=s;i<=e;i++) push(i);
    if (curr < tot-2) push('…'); push(tot); return out;
  }
  const pages = pageWindow(page, totalPages);

  return (
    // <AdminLayout title="Groups">
      <div className="bg-white rounded-xl shadow-sm border p-4">
        {/* KPI STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          <StatCard label="Groups"        value={stats.totalGroups}  gradient="from-fuchsia-600 to-purple-500" />
          <StatCard label="Public Groups" value={stats.publicGroups} gradient="from-indigo-500 to-violet-500" />
          <StatCard label="Total Members" value={stats.totalMembers} gradient="from-sky-500 to-blue-500" />
        </div>

        {/* filters / search */}
        <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={privacy} onValueChange={(v)=>{ setPage(1); setPrivacy(v as any); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Privacy" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All privacy</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="secret">Secret</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search by title / web address"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              onKeyDown={(e)=>e.key==='Enter' && (setPage(1), load())}
              className="w-full sm:w-72"
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

        {/* table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Privacy</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell className="max-w-[360px] truncate">{r.title}</TableCell>
                  <TableCell>{r.adminUsername || '-'}</TableCell>
                  <TableCell className="capitalize">{r.privacy || 'public'}</TableCell>
                  <TableCell>{(r.membersCount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>
                    {r.slug
                      ? <Link target="_blank" to={`/groups/${r.slug}`}>View</Link>
                      : <Link target="_blank" to={`/groups/${r.id}`}>View</Link>}
                  </TableCell>
                  <TableCell>{fmt(r.createdAt)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove(r.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* pagination */}
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

              {pages.map((p, idx) =>
                p === '…' ? (
                  <PaginationItem key={`ell-${idx}`}>
                    <span className="px-2 text-gray-400">…</span>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink isActive={p === page} onClick={() => setPage(p as number)}>
                      {p}
                    </PaginationLink>
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
    // </AdminLayout>
  );
}
