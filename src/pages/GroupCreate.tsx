import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { fetchGroupCategories, createGroup, listMyGroupInvites } from '@/services/groupsService';
import { FilePlus2, Inbox } from 'lucide-react';
import GroupsSidebar from '@/components/groups/groupsidebar';


export default function GroupCreate() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  const nav = useNavigate();

  const [cats, setCats] = useState<any[]>([]);
  const [invCount, setInvCount] = useState(0);

  const [form, setForm] = useState({
    group_name: '',
    group_title: '',
    group_privacy: 'public',
    group_category: '',
    group_country: '',
    group_description: ''
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetchGroupCategories(headersRef.current).then(setCats).catch(console.error);
    listMyGroupInvites(headersRef.current).then(arr => setInvCount(arr.length)).catch(() => {});
  }, [accessToken]);

  const onSubmit = async () => {
    const { group_name, group_title, group_category, group_country } = form;
    if (!group_name || !group_title || !group_category || !group_country) return;
    if (busy) return;
    setBusy(true);
    try {
      await createGroup(
        {
          ...form,
          group_category: Number(form.group_category),
          group_country: Number(form.group_country)
        },
        headersRef.current
      );
      nav(`/groups/${form.group_name}`);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="col-span-12 md:col-span-3">
          <GroupsSidebar highlight="discover"/>
        </aside>

        {/* RIGHT CONTENT – Create form */}
        <main className="col-span-12 md:col-span-9">
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="text-xl font-semibold">Create a Group</div>

            <Input placeholder="Username (handle)" value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} />
            <Input placeholder="Title" value={form.group_title} onChange={(e) => setForm({ ...form, group_title: e.target.value })} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select className="border rounded px-2 py-2 bg-white w-full"
                      value={form.group_privacy} onChange={(e) => setForm({ ...form, group_privacy: e.target.value })}>
                <option value="public">Public</option>
                <option value="closed">Closed (approval)</option>
                <option value="secret">Secret (invite only)</option>
              </select>

              <select className="border rounded px-2 py-2 bg-white w-full"
                      value={form.group_category} onChange={(e) => setForm({ ...form, group_category: e.target.value })}>
                <option value="">Select category</option>
                {cats.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
            </div>

            <Input placeholder="Country ID (numeric)" value={form.group_country} onChange={(e) => setForm({ ...form, group_country: e.target.value })} />

            <Textarea placeholder="Description" value={form.group_description} onChange={(e) => setForm({ ...form, group_description: e.target.value })} />

            <div className="flex justify-end">
              <Button onClick={onSubmit} disabled={busy}>{busy ? 'Creating…' : 'Create'}</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
