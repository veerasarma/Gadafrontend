import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8085";

function toInputValue(v?: string | null) {
  if (!v) return "";
  // server returns "YYYY-MM-DD HH:MM:SS" or ISO; convert to input[datetime-local]
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const pad = (n:number) => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Category = { id: number; parentId: number; name: string; sort: number };

export default function AdminEventForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cover, setCover] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // Build a flat label like: "Parent / Child" (if parentId > 0)
  const categoryLabel = (c: Category) => {
    console.log(c.parentId,'c.parentId')
    if (!c.parentId) return c.name;
    const parent = categories.find(p => p.id === c.parentId);
    return parent ? `${parent.name} / ${c.name}` : c.name;
  };

  const loadCategories = async () => {
    setLoadingCats(true);
    try {
      const r = await fetch(`${API}/api/admin/events/categories`, { headers });
      if (!r.ok) throw new Error("Failed");
      const data = await r.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoadingCats(false);
    }
  };

  const loadEvent = async () => {
    if (!isEdit) return;
    const r = await fetch(`${API}/api/admin/events/${id}`, { headers });
    if (!r.ok) return toast.error("Not found");
    const e = await r.json();
    setTitle(e.title || "");
    setDescription(e.description || "");
    setPrivacy(e.privacy || "public");
    setStartsAt(toInputValue(e.startsAt));
    setEndsAt(toInputValue(e.endsAt));
    setLocation(e.location || "");
    setCategoryId(e.category_id || null);
    setCover(e.cover || "");
  };

  useEffect(() => {
    if (!ready) return;
    // load both; cats first so the select is populated when we preselect categoryId
    (async () => {
      await loadCategories();
      await loadEvent();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const save = async () => {
    if (!title.trim()) return toast.error("Title is required");
    if (!startsAt) return toast.error("Start date/time is required");

    const payload = {
      adminId: user?.userId, // creator if needed
      title: title.trim(),
      description,
      privacy,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      location,
      categoryId,
      cover
    };

    const url = isEdit ? `${API}/api/admin/events/${id}` : `${API}/api/admin/events`;
    const method = isEdit ? "PUT" : "POST";

    const r = await fetch(url, {
      method,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      const err = await r.json().catch(()=>({}));
      return toast.error(err?.error || "Save failed");
    }
    toast.success("Saved");
    navigate("/admin/events");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Events › {isEdit ? "Edit" : "Add New"}</h2>
        <Button variant="outline" onClick={()=>navigate("/admin/events")}>Go Back</Button>
      </div>

      <div className="space-y-6 max-w-3xl">
        <div>
          <div className="mb-1 font-medium">Title</div>
          <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Event title" />
        </div>

        <div>
          <div className="mb-1 font-medium">Description</div>
          <Textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional description" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="mb-1 font-medium">Privacy</div>
            <Select value={privacy} onValueChange={setPrivacy}>
              <SelectTrigger><SelectValue placeholder="public/private" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="mb-1 font-medium">Category (optional)</div>
            {categories?
            <Select
              value={String(categoryId ?? '')}
              onValueChange={(v)=>setCategoryId(v ? Number(v) : null)}
              disabled={loadingCats}
            >
              <SelectTrigger><SelectValue placeholder={loadingCats ? "Loading…" : "Select a category"} /></SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="fsdfsd">All</SelectItem> */}
                {categories.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{categoryLabel(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>:''
             }
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="mb-1 font-medium">Starts At</div>
            <Input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} />
          </div>
          <div>
            <div className="mb-1 font-medium">Ends At (optional)</div>
            <Input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="mb-1 font-medium">Location (optional)</div>
          <Input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City / Venue" />
        </div>

        <div>
          <div className="mb-1 font-medium">Cover (path/url – optional)</div>
          <Input value={cover} onChange={e=>setCover(e.target.value)} placeholder="uploads/2025/08/cover.jpg" />
        </div>

        <div><Button onClick={save}>Save Changes</Button></div>
      </div>
    </div>
  );
}
