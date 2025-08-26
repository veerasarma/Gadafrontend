import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

type Option = { id: number; name: string };

export default function AdminPageCategoryForm() {
  const { id } = useParams();              // undefined → create; else edit
  const isEdit = !!id;
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => 'Authorization' in headers, [headers]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<number>(0);
  const [order, setOrder] = useState<number>(0);

  const [options, setOptions] = useState<Option[]>([]);

  const loadOptions = async () => {
    const r = await fetch(`${API_BASE_URL}/api/admin/page-categories/options`, { headers });
    const data = await r.json();
    setOptions(data || []);
  };

  const load = async () => {
    if (!isEdit) return;
    const r = await fetch(`${API_BASE_URL}/api/admin/page-categories/${id}`, { headers });
    if (!r.ok) { toast.error('Category not found'); return; }
    const c = await r.json();
    setName(c.name || '');
    setDescription(c.description || '');
    setParentId(Number(c.parentId || 0));
    setOrder(Number(c.order || 0));
  };

  useEffect(() => { if (ready) { loadOptions(); load(); } }, [ready]);

  const save = async () => {
    if (!name.trim()) return toast.error('Name is required');

    const payload = { name: name.trim(), description, parentId, order };
    const url = isEdit
      ? `${API_BASE_URL}/api/admin/page-categories/${id}`
      : `${API_BASE_URL}/api/admin/page-categories`;
    const method = isEdit ? 'PUT' : 'POST';

    const r = await fetch(url, {
      method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      const err = await r.json().catch(()=>({}));
      return toast.error(err?.error || 'Save failed');
    }
    toast.success('Saved');
    navigate('/admin/page-categories');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Pages › Categories › {isEdit ? 'Edit Category' : 'Add New Category'}
        </h2>
        <Button variant="outline" onClick={()=>navigate('/admin/page-categories')}>Go Back</Button>
      </div>

      <div className="space-y-6 max-w-3xl">
        <div>
          <div className="mb-1 font-medium">Name</div>
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter name" />
        </div>

        <div>
          <div className="mb-1 font-medium">Description</div>
          <Textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional description" />
        </div>

        <div>
          <div className="mb-1 font-medium">Parent Category</div>
          <Select value={String(parentId)} onValueChange={(v)=>setParentId(Number(v))}>
            <SelectTrigger className="w-full sm:w-96">
              <SelectValue placeholder="Set as a Parent Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Set as a Parent Category</SelectItem>
              {options.map(o => (
                <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-1 font-medium">Order</div>
          <Input type="number" value={order} onChange={e=>setOrder(Number(e.target.value || 0))} className="w-40" />
        </div>

        <div>
          <Button onClick={save}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
