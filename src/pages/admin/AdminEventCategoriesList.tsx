import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8085";

type Cat = {
  id: number;
  parentId: number;
  name: string;
  description: string;
  order: number;
  parentName?: string | null;
  childCount: number;
  usedCount: number;
};

export default function AdminEventCategoriesList() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);

  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const [page, setPage] = useState(Number(params.get("page") || 1));
  const [data, setData] = useState<{items: Cat[]; total: number; totalPages: number} | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/events-categories?search=${encodeURIComponent(search)}&page=${page}&limit=25`, { headers });
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (ready) fetchList(); /* eslint-disable-next-line */ }, [ready, page]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setParams(prev => { prev.set("q", search); prev.set("page", "1"); return prev; });
    fetchList();
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    try {
      const r = await fetch(`${API}/api/admin/events-categories/${id}`, { method: "DELETE", headers });
      if (!r.ok) {
        const err = await r.json().catch(()=>({}));
        return toast.error(err?.error || "Delete failed");
      }
      toast.success("Deleted");
      fetchList();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Events › Categories</h2>
        <Button asChild><Link to="/admin/events-categories/new">+ Add New Category</Link></Button>
      </div>

      <form onSubmit={onSearch} className="flex gap-2">
        <Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by name or description" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Title</th>
              <th className="p-3">Parent</th>
              <th className="p-3">Order</th>
              <th className="p-3">Used</th>
              <th className="p-3">Children</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4" colSpan={6}>Loading…</td></tr>}
            {!loading && data?.items?.length === 0 && <tr><td className="p-4" colSpan={6}>No categories</td></tr>}
            {!loading && data?.items?.map(c => (
              <tr key={c.id} className="border-b">
                <td className="p-3">
                  <div className="font-medium">{c.name}</div>
                  {c.description && <div className="text-xs text-gray-500 line-clamp-2">{c.description}</div>}
                </td>
                <td className="p-3">{c.parentId === 0 ? '—' : (c.parentName || '—')}</td>
                <td className="p-3">{c.order}</td>
                <td className="p-3">{c.usedCount}</td>
                <td className="p-3">{c.childCount}</td>
                <td className="p-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button asChild size="sm" variant="outline"><Link to={`/admin/events-categories/${c.id}`}>Edit</Link></Button>
                    <Button size="sm" variant="destructive" onClick={()=>remove(c.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
          <div className="text-sm">Page {page} / {data.totalPages}</div>
          <Button variant="outline" size="sm" disabled={page>=data.totalPages} onClick={()=>setPage(p=>p+1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
