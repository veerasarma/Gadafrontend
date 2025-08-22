// src/pages/PageCreate.tsx
import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { fetchCategories, createPage, listMyInvites } from '@/services/pagesService';
import { FilePlus2, Inbox } from 'lucide-react';
import PagesSidebar from '@/components/pages/pagesSidebar';

export default function PageCreate() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  const nav = useNavigate();

  // Sidebar data
  const [cats, setCats] = useState<any[]>([]);
  const [invCount, setInvCount] = useState(0);

  // Form state
  const [form, setForm] = useState({
    page_name: '',
    page_title: '',
    page_category: '',
    page_country: '',
    page_description: ''
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetchCategories(headersRef.current).then(setCats).catch(console.error);
    listMyInvites(headersRef.current).then(arr => setInvCount(arr.length)).catch(() => {});
  }, [accessToken]);

  const onSubmit = async () => {
    if (!form.page_name || !form.page_title || !form.page_category || !form.page_country) return;
    if (busy) return;
    setBusy(true);
    try {
      await createPage(
        {
          ...form,
          page_category: Number(form.page_category),
          page_country: Number(form.page_country)
        },
        headersRef.current
      );
      nav(`/pages/${form.page_name}`);
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
        {/* LEFT SIDEBAR (same as Pages index/invites) */}
        <aside className="col-span-12 md:col-span-3">
          <PagesSidebar/>
        </aside>

        {/* RIGHT CONTENT – Create form */}
        <main className="col-span-12 md:col-span-9">
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="text-xl font-semibold">Create a Page</div>

            <Input
              placeholder="Username (handle)"
              value={form.page_name}
              onChange={(e) => setForm({ ...form, page_name: e.target.value })}
            />

            <Input
              placeholder="Title"
              value={form.page_title}
              onChange={(e) => setForm({ ...form, page_title: e.target.value })}
            />

            <select
              className="border rounded px-2 py-2 bg-white w-full"
              value={form.page_category}
              onChange={(e) => setForm({ ...form, page_category: e.target.value })}
            >
              <option value="">Select category</option>
              {cats.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>

            <Input
              placeholder="Country ID (numeric)"
              value={form.page_country}
              onChange={(e) => setForm({ ...form, page_country: e.target.value })}
            />

            <Textarea
              placeholder="Description"
              value={form.page_description}
              onChange={(e) => setForm({ ...form, page_description: e.target.value })}
            />

            <div className="flex justify-end">
              <Button onClick={onSubmit} disabled={busy}>
                {busy ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
