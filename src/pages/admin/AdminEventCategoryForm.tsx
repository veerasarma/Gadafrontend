import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8085";

type Cat = { id: number; parentId: number; name: string; sort: number };

export default function AdminEventCategoryForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");     // NOT NULL in DB (can be '')
  const [parentId, setParentId] = useState<string>("0");  // 0 = top level
  const [order, setOrder] = useState<number>(1);          // default 1

  const [cats, setCats] = useState<Cat[]>([]);

  const loadCats = async () => {
    const r = await fetch(`${API}/api/admin/events-categories/select`, { headers });
    if (r.ok) setCats(await r.json());
  };

  const loadRow = async () => {
    if (!isEdit) return;
    const r = await fetch(`${API}/api/admin/events-categories/${id}`, { headers });
    if (!r.ok) return toast.error("Not found");
    const row = await r.json();
    setName(row.name || "");
    setDescription(row.description ?? "");
    setParentId(String(row.parentId ?? 0));
    setOrder(row.order ?? 1);
  };

  useEffect(() => { if (ready) { loadCats(); loadRow(); } /* eslint-disable-next-line */ }, [ready]);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");

    const payload = {
      name: name.trim(),
      description: description ?? "",
      parentId: Number(parentId || 0),
      order: Number.isFinite(order) && order >= 1 ? order : 1,
    };

    const url = isEdit
      ? `${API}/api/admin/events-categories/${id}`
      : `${API}/api/admin/events-categories`;
    const method = isEdit ? "PUT" : "POST";

    const r = await fetch(url, {
      method,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json().catch(()=>({}));
      return toast.error(err?.error || "Save failed");
    }
    toast.success("Saved");
    navigate("/admin/events/categories");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Events › Categories › {isEdit ? "Edit" : "Add New"}</h2>
        <Button asChild variant="outline"><Link to="/admin/events/categories">Go Back</Link></Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 max-w-3xl space-y-5">
        <div>
          <div className="mb-1 font-medium">Name</div>
          <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g. Conferences" />
        </div>

        <div>
          <div className="mb-1 font-medium">Description</div>
          <Textarea rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Optional (may be empty)" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="mb-1 font-medium">Parent Category</div>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="Set as a Parent Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">— (Top Level)</SelectItem>
                {cats
                  .filter(c => String(c.id) !== String(id)) // not its own parent
                  .map(c => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1 font-medium">Order</div>
            <Input type="number" min={1} value={String(order)} onChange={(e)=>setOrder(Number(e.target.value || 1))} />
          </div>
        </div>

        <div><Button onClick={save}>Save Changes</Button></div>
      </div>
    </div>
  );
}
