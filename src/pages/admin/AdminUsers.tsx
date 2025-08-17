// src/admin/pages/AdminUsers.tsx
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${r.status === 'active' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>
                    {r.status || 'Active'}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" className="bg-red-500 hover:bg-red-600">Suspend</Button>
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
