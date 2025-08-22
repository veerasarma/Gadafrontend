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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="col-span-12 md:col-span-3">
          <div className="md:sticky md:top-20 bg-white rounded-lg shadow p-3 space-y-2">
            <div className="text-sm font-semibold text-gray-700 mb-1">Groups</div>

            <Link to="/groups" className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100">Discover</Link>
            <Link to="/groups?my=1" className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100">Your Groups</Link>

            <div className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-100">
              <span className="flex items-center"><Inbox className="h-4 w-4 mr-2" /> Invites</span>
              {invCount > 0 && (
                <span className="text-xs bg-[#1877F2] text-white rounded-full px-2 py-0.5">{invCount}</span>
              )}
            </div>

            <div className="flex items-center px-3 py-2 rounded bg-gray-50">
              <FilePlus2 className="h-4 w-4 mr-2" /> Create Group
            </div>

            <div className="h-px bg-gray-200 my-2" />
            <div className="text-xs text-gray-500 uppercase tracking-wide px-1 mb-1">Categories</div>
            <div className="max-h-64 overflow-auto pr-1 space-y-1">
              <Link to="/groups" className="block w-full text-left px-3 py-1.5 rounded hover:bg-gray-100">All</Link>
              {cats.map((c) => (
                <Link key={c.category_id} to={`/groups?categoryId=${c.category_id}`} className="block w-full text-left px-3 py-1.5 rounded hover:bg-gray-100">
                  {c.category_name}
                </Link>
              ))}
            </div>
          </div>
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
