import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085';

type Row = {
  id: number;
  parentId: number;
  name: string;
  description: string;
  order: number;
};

type FormState = {
  id?: number;
  parentId: number;
  name: string;
  description: string;
  order: number;
};

export default function AdminReportCategories() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => 'Authorization' in headers, [headers]);

  // list + search
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');

  // editor
  const [open, setOpen] = useState(false);
  const emptyForm: FormState = { parentId: 0, name: '', description: '', order: 1 };
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('search', q.trim());
    const r = await fetch(`${API_BASE_URL}/api/admin/report-categories?` + params, { headers });
    if (!r.ok) return toast.error('Failed to load categories');
    const data = await r.json();
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => { if (ready) load(); }, [ready]);

  // ----- CRUD -----
  const startCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const startEdit = (row: Row) => {
    setForm({
      id: row.id,
      parentId: row.parentId ?? 0,
      name: row.name ?? '',
      description: row.description ?? '',
      order: row.order ?? 1,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id
        ? `${API_BASE_URL}/api/admin/report-categories/${form.id}`
        : `${API_BASE_URL}/api/admin/report-categories`;
      const r = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: Number(form.parentId) || 0,
          name: form.name.trim(),
          description: form.description ?? '',
          order: Number(form.order) || 1,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.error || 'Save failed');
      }
      toast.success(form.id ? 'Updated' : 'Created');
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    if (!confirm(`Delete category "${row.name}"?`)) return;
    const r = await fetch(`${API_BASE_URL}/api/admin/report-categories/${row.id}`, {
      method: 'DELETE',
      headers
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return toast.error(err?.error || 'Delete failed');
    }
    toast.success('Deleted');
    load();
  };

  // Helpers
  const parentOptions = useMemo(
    () => [{ id: 0, name: '— Parent (no parent) —' }, ...rows.filter(r => !r.parentId).map(r => ({ id: r.id, name: r.name }))],
    [rows]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Reports › Categories</h2>
        <Button onClick={startCreate}>+ Add New Category</Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by name or description"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
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
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="align-top">
                  <div className="font-medium">{r.name}</div>
                  {r.parentId
                    ? <div className="text-xs text-gray-500">Child of #{r.parentId}</div>
                    : <div className="text-xs text-gray-500">Parent</div>}
                </TableCell>
                <TableCell className="align-top">{r.description || <span className="text-gray-400">—</span>}</TableCell>
                <TableCell className="align-top">
                  <span className="inline-flex items-center rounded-full bg-cyan-100 text-cyan-700 px-2 py-0.5 text-xs font-medium">
                    {r.order}
                  </span>
                </TableCell>
                <TableCell className="align-top space-x-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(r)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(r)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  No categories found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Editor dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g., Nudity"
              />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            <div className="grid gap-2">
              <Label>Parent</Label>
              <Select
                value={String(form.parentId)}
                onValueChange={(v) => setForm((s) => ({ ...s, parentId: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  {parentOptions.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Order</Label>
              <Input
                type="number"
                min={1}
                value={form.order}
                onChange={(e) => setForm((s) => ({ ...s, order: Number(e.target.value || 1) }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
