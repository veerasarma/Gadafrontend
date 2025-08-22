import { useEffect, useRef, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { fetchGroupCategories, listGroups, listMyGroupInvites } from '@/services/groupsService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, FilePlus2, Inbox } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export default function GroupsIndex() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState<number | ''>(searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : '');
  const [sort, setSort] = useState<'popular'|'recent'>((searchParams.get('sort') as any) || 'popular');
  const my = searchParams.get('my') === '1';

  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [invCount, setInvCount] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    fetchGroupCategories(headersRef.current).then(setCats).catch(console.error);
    listMyGroupInvites(headersRef.current).then(arr => setInvCount(arr.length)).catch(()=>{});
  }, [accessToken]);

  useEffect(() => {
    const p: any = {};
    if (q) p.q = q;
    if (categoryId) p.categoryId = categoryId;
    if (sort && sort !== 'popular') p.sort = sort;
    if (my) p.my = '1';
    setSearchParams(p, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryId, sort, my]);

  useEffect(() => {
    if (!accessToken) return;
    setItems(null); setCursor(null); setDone(false);
    Promise.resolve().then(() => loadMore(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryId, sort, my, accessToken]);

  const loadMore = async (reset=false) => {
    if (loading) return;
    if (!reset && done) return;
    setLoading(true);
    try {
      const { items: pageItems = [], nextCursor } = await listGroups(
        { q: q.trim(), categoryId: categoryId || undefined, sort, my: my ? 1 : undefined, cursor: reset ? undefined : cursor, limit: 12 },
        headersRef.current
      );
      setItems(prev => (prev ? [...prev, ...pageItems] : pageItems));
      setCursor(nextCursor ?? null);
      if (!nextCursor || pageItems.length === 0) setDone(true);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        {/* LEFT SIDEBAR (sticky) */}
        <aside className="col-span-12 md:col-span-3">
          <div className="md:sticky md:top-20 bg-white rounded-lg shadow p-3 space-y-2">
            <div className="text-sm font-semibold text-gray-700 mb-1">Groups</div>

            <button
              onClick={() => nav('/groups')}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${!my ? 'bg-gray-50' : ''}`}
            >
              Discover
            </button>
            <button
              onClick={() => nav('/groups?my=1')}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${my ? 'bg-gray-50' : ''}`}
            >
              Your Groups
            </button>

            <Link to="/groups/invites" className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-100">
              <span className="flex items-center"><Inbox className="h-4 w-4 mr-2" /> Invites</span>
              {invCount > 0 && <span className="text-xs bg-[#1877F2] text-white rounded-full px-2 py-0.5">{invCount}</span>}
            </Link>

            <Link to="/groups/create" className="flex items-center px-3 py-2 rounded hover:bg-gray-100">
              <FilePlus2 className="h-4 w-4 mr-2" /> Create Group
            </Link>

            <div className="h-px bg-gray-200 my-2" />
            <div className="text-xs text-gray-500 uppercase tracking-wide px-1 mb-1">Categories</div>
            <div className="max-h-64 overflow-auto pr-1 space-y-1">
              <button
                onClick={() => setCategoryId('')}
                className={`w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 ${categoryId === '' ? 'bg-gray-50' : ''}`}
              >All</button>
              {cats.map(c => (
                <button
                  key={c.category_id}
                  onClick={() => setCategoryId(Number(c.category_id))}
                  className={`w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 ${categoryId === c.category_id ? 'bg-gray-50' : ''}`}
                >
                  {c.category_name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="col-span-12 md:col-span-9">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search groups…" className="max-w-sm" />
            <select className="border rounded px-2 py-2 bg-white"
                    value={categoryId} onChange={(e)=>setCategoryId(e.target.value?Number(e.target.value):'')}>
              <option value="">All categories</option>
              {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
            <select className="border rounded px-2 py-2 bg-white" value={sort} onChange={e=>setSort(e.target.value as any)}>
              <option value="popular">Popular</option>
              <option value="recent">Recent</option>
            </select>
          </div>

          {items === null && (
            <div className="text-gray-500"><Loader2 className="inline h-4 w-4 animate-spin" /> Loading…</div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
            {Array.isArray(items) && items.map(it => (
              <Link key={it.group_id ?? it.groupId} to={`/groups/${it.group_name}`} className="bg-white rounded-lg shadow hover:shadow-md transition">
                <div className="aspect-[3/1] bg-gray-200 rounded-t-lg overflow-hidden">
                  {it.group_cover && <img src={`${API_BASE_URL}/uploads/${it.group_cover}`} className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                      {it.group_picture && <img src={`${API_BASE_URL}/uploads/${it.group_picture}`} className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{it.group_title}</div>
                      <div className="text-xs text-gray-500 truncate">@{it.group_name}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">{it.group_members} members · {it.group_privacy}</div>
                </div>
              </Link>
            ))}
          </div>

          {!done && (
            <div className="flex justify-center mt-4">
              <Button onClick={() => loadMore(false)} disabled={loading}>
                {loading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
