const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/'; 
// src/pages/admin/AdminPosts.tsx
import { useEffect, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { toast } from 'sonner';

type PostRow = {
    id: string;
    authorId: string;
    authorUsername: string;
    content: string;
    createdAt: string;
    isDeleted: 0|1;
  isShadowHidden: 0|1;
  likeCount: number;
  commentCount: number;
};

export default function AdminPosts() {
    const {accessToken} = useAuth();
      const headers = useAuthHeader(accessToken);
  const ready = useMemo(()=> 'Authorization' in headers, [headers]);

  const [rows, setRows] = useState<PostRow[]>([]);
  const [status, setStatus] = useState<'all'|'visible'|'shadow'|'deleted'>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // new meta from API
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  const load = async () => {
    try {
      const params = new URLSearchParams({
        status,
        search: q,
        page: String(page),
        limit: String(limit)
      });
      const r = await fetch(`${API_BASE_URL}api/admin/posts?${params.toString()}`, { headers });
      if (!r.ok) throw new Error('Failed to load posts');
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

  useEffect(()=>{ if (ready) load(); }, [ready, status, page, limit]);

  const act = async (id: string, action: 'remove'|'restore'|'shadow'|'unshadow') => {
    try {
      const r = await fetch(`/api/admin/posts/${id}/visibility`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!r.ok) throw new Error('Action failed');
      toast.success('Updated');
      load();
    } catch (e:any) {
      toast.error('Failed', { description: e?.message });
    }
  };

  // build compact page window: 1 … [page-1, page, page+1] … total
  function pageWindow(curr: number, total: number) {
    const pages: (number | '…')[] = [];
    const push = (v: number | '…') => pages.push(v);

    if (total <= 7) {
      for (let i=1;i<=total;i++) push(i);
      return pages;
    }
    push(1);
    if (curr > 3) push('…');
    const start = Math.max(2, curr - 1);
    const end   = Math.min(total - 1, curr + 1);
    for (let i=start; i<=end; i++) push(i);
    if (curr < total - 2) push('…');
    push(total);
    return pages;
  }

  const pages = pageWindow(page, totalPages);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={status} onValueChange={(v)=>{setPage(1); setStatus(v as any);}}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="visible">Visible</SelectItem>
              <SelectItem value="shadow">Shadow-hidden</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Search content/author"
            value={q}
            onChange={e=>setQ(e.target.value)}
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

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Post</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Likes</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="max-w-[520px]">
                  <div className="text-sm line-clamp-2">{r.content}</div>
                  <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                  {(r.isDeleted || r.isShadowHidden) && (
                    <div className="mt-1 text-xs">
                      {r.isDeleted ? <span className="text-red-600">Deleted</span> : null}
                      {r.isShadowHidden ? <span className="text-amber-600 ml-2">Shadow-hidden</span> : null}
                    </div>
                  )}
                </TableCell>
                <TableCell>{r.authorUsername}</TableCell>
                <TableCell>{r.likeCount}</TableCell>
                <TableCell>{r.commentCount}</TableCell>
                <TableCell className="text-right space-x-2">
                  {r.isDeleted
                    ? <Button size="sm" onClick={()=>act(r.id,'restore')}>Restore</Button>
                    : <Button size="sm" variant="destructive" onClick={()=>act(r.id,'remove')}>Remove</Button>}
                  {r.isShadowHidden
                    ? <Button size="sm" variant="secondary" onClick={()=>act(r.id,'unshadow')}>Unshadow</Button>
                    : <Button size="sm" variant="secondary" onClick={()=>act(r.id,'shadow')}>Shadow</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Numbered pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">Showing {(rows.length ? (page - 1) * limit + 1 : 0)}–{(page - 1) * limit + rows.length} of {total}</div>

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
