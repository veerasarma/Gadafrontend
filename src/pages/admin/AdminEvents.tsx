import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8085";

type Item = {
  id: number;
  title: string;
  privacy: string;
  startsAt: string;
  endsAt: string | null;
  location?: string | null;
  adminId: number;
  adminName: string;
  adminAvatar?: string | null;
  interestedCount: number;
  goingCount: number;
  invitedCount: number;
};

export default function AdminEvents() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);
  const navigate = useNavigate();

  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (p = 1) => {
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (q.trim()) params.set("search", q.trim());
    const r = await fetch(`${API}/api/admin/events?${params}`, { headers });
    if (!r.ok) return toast.error("Failed to load events");
    const data = await r.json();
    setItems(data.items || []);
    setPage(data.page || 1);
    setTotalPages(data.totalPages || 1);
  };

  useEffect(() => { if (ready) load(1); }, [ready]);

  const remove = async (id: number, title: string) => {
    if (!confirm(`Delete event "${title}"?`)) return;
    const r = await fetch(`${API}/api/admin/events/${id}`, { method: "DELETE", headers });
    if (!r.ok) return toast.error("Delete failed");
    toast.success("Deleted");
    load(page);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Events</h2>
        <Button onClick={() => navigate("/admin/events/new")}>+ Add Event</Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by title or admin"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(1)}
          className="w-full sm:w-96"
        />
        <Button onClick={() => load(1)}>Search</Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Privacy</TableHead>
              <TableHead className="text-right">Interested</TableHead>
              <TableHead className="text-right">Going</TableHead>
              <TableHead className="text-right">Invited</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(ev => (
              <TableRow key={ev.id}>
                <TableCell>{ev.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{ev.title}</div>
                  <div className="text-xs text-gray-500">
                    {ev.startsAt ? format(new Date(ev.startsAt), "PPp") : "" }
                    {ev.endsAt ? ` — ${format(new Date(ev.endsAt), "PPp")}` : ""}
                    {ev.location ? ` · ${ev.location}` : ""}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {ev.adminAvatar ? (
                      <img src={`${API}/uploads/${ev.adminAvatar}`} alt="" className="h-6 w-6 rounded-full object-cover bg-gray-100" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-200" />
                    )}
                    <span className="text-sm">{ev.adminName}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{ev.privacy}</TableCell>
                <TableCell className="text-right">{ev.interestedCount}</TableCell>
                <TableCell className="text-right">{ev.goingCount}</TableCell>
                <TableCell className="text-right">{ev.invitedCount}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Link to={`/admin/events/${ev.id}`}>
                    <Button size="sm" variant="outline">Edit</Button>
                  </Link>
                  <Button size="sm" variant="destructive" onClick={() => remove(ev.id, ev.title)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {!items.length && (
              <TableRow><TableCell colSpan={8} className="text-center text-gray-500">No events found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <Button variant="outline" disabled={page<=1} onClick={()=>load(page-1)}>Prev</Button>
        <div className="text-sm text-gray-600">Page {page} / {totalPages}</div>
        <Button variant="outline" disabled={page>=totalPages} onClick={()=>load(page+1)}>Next</Button>
      </div>
    </div>
  );
}
