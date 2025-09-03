// src/admin/pages/AdminUsers.tsx
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import AdminEditUserDrawer from "@/components/admin/AdminEditUserDrawer";


const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085';

type Dir = 'asc' | 'desc';

export default function AdminUsers() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'createdAt' | 'email' | 'username'>('createdAt');
  const [dir, setDir] = useState<Dir>('desc');
  const [loading, setLoading] = useState(false);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const [editId, setEditId] = useState<number | null>(null);
const [drawerOpen, setDrawerOpen] = useState(false);

function openEdit(id: number) {
  setEditId(id);
  setDrawerOpen(true);
}

  async function load() {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
        sort,
        dir,
      });
      const res = await fetch(`${API}/api/admin/users?${q.toString()}`, { headers });
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      console.log(data,'datadatadata')
      setRows(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, sort, dir, accessToken]);

  function isBanned(row: any) {
    return row?.user_banned === 1 || row?.user_banned === '1' || row?.banned === true;
  }
  
  async function toggleSuspend(id: number, next: boolean, headers: HeadersInit) {
    const res = await fetch(`${API}/api/admin/users/${id}/suspend`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ banned: next }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(t || 'Suspend request failed');
    }
    return res.json() as Promise<{ ok: boolean; userId: number; banned: boolean }>;
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const q = new URLSearchParams({ search, sort, dir, format });
      const res = await fetch(`${API}/api/admin/users/export?${q.toString()}`, {
        headers,
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'csv' ? 'users.csv' : 'users.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export prepared');
    } catch (e: any) {
      toast.error(e.message || 'Export failed');
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search username or email…"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="w-full md:w-80"
        />
        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="username">Username</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dir} onValueChange={(v) => setDir(v as Dir)}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Dir" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Desc</SelectItem>
            <SelectItem value="asc">Asc</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => load()} disabled={loading}>Search</Button>

        <div className="ml-auto flex gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('csv')}>Export CSV</Button>
          <Button variant="outline" onClick={() => handleExport('json')}>Export JSON</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead className="w-48">User</TableHead>
              <TableHead className="w-72">Email</TableHead>
              <TableHead className="w-48">Created</TableHead>
              <TableHead className="w-32">Role</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-48">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap truncate">{r.username}</TableCell>
                <TableCell className="whitespace-nowrap truncate">{r.email}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize">
                    {r.role ?? 'user'}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {isBanned(r) ? (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-red-50 text-red-700 border border-red-200">
                      Suspended
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(r.id)}>Edit</Button>

                    <Button
                      size="sm"
                      className={isBanned(r) ? 'bg-slate-600 hover:bg-slate-700' : 'bg-red-500 hover:bg-red-600'}
                      onClick={async () => {
                        try {
                          const next = !isBanned(r);
                          const resp = await toggleSuspend(r.id, next, headers);
                          console.log(resp,'respresp')
                          // Update row locally so we don't need a full reload
                          setRows(prev => prev.map(x =>
                            x.id === r.id ? { ...x, user_banned: resp.banned ? '1' : '0', banned: resp.banned } : x
                          ));
                          toast.success(resp.banned ? 'User suspended' : 'User unsuspended');
                        } catch (e: any) {
                          toast.error(e?.message || 'Failed to update user');
                        }
                      }}
                    >
                      {isBanned(r) ? 'Unsuspend' : 'Suspend'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AdminEditUserDrawer
  userId={editId}
  open={drawerOpen}
  onOpenChange={setDrawerOpen}
  onSaved={() => {
    // optionally refresh your users list here
    // loadUsers();
  }}
/>


      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Page {page} of {totalPages} — {total} users
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
