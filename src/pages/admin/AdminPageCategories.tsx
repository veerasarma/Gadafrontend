import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

type Row = {
  id: number;
  parentId: number;
  name: string;
  description: string;
  order: number;
};

export default function AdminPageCategories() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => 'Authorization' in headers, [headers]);
  const navigate = useNavigate();

  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');

  const load = async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('search', q.trim());
    const r = await fetch(`${API_BASE_URL}/api/admin/page-categories?` + params, { headers });
    if (!r.ok) return toast.error('Failed to load categories');
    const data = await r.json();
    setRows(data || []);
  };

  useEffect(() => { if (ready) load(); }, [ready]);

  const remove = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    const r = await fetch(`${API_BASE_URL}/api/admin/page-categories/${id}`, { method: 'DELETE', headers });
    if (!r.ok) {
      const err = await r.json().catch(()=>({}));
      return toast.error(err?.error || 'Delete failed');
    }
    toast.success('Deleted');
    load();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Pages › Categories</h2>
        <Button onClick={() => navigate('/admin/page-categories/new')}>+ Add New Category</Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by name or description"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          onKeyDown={(e)=>e.key==='Enter' && load()}
          className="w-full sm:w-96"
        />
        <Button onClick={load}>Search</Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Order</TableHead>
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="align-top">
                  <div className="font-medium">{r.name}</div>
                  {r.parentId ? <div className="text-xs text-gray-500">Child of #{r.parentId}</div> : <div className="text-xs text-gray-500">Parent</div>}
                </TableCell>
                <TableCell className="align-top">{r.description || <span className="text-gray-400">—</span>}</TableCell>
                <TableCell className="align-top">
                  <span className="inline-flex items-center rounded-full bg-cyan-100 text-cyan-700 px-2 py-0.5 text-xs font-medium">{r.order}</span>
                </TableCell>
                <TableCell className="align-top space-x-2">
                  <Button size="sm" variant="outline" onClick={()=>navigate(`/admin/page-categories/${r.id}`)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={()=>remove(r.id, r.name)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow><TableCell colSpan={4} className="text-center text-gray-500">No categories found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
