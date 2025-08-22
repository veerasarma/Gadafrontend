import { useEffect, useRef, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { fetchCategories, listPages, listMyInvites } from '@/services/pagesService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, FilePlus2, Inbox } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PagesSidebar from '@/components/pages/pagesSidebar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export default function PagesIndex() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState<number | ''>(searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : '');
  const [sort, setSort] = useState<'recent'|'popular'>((searchParams.get('sort') as any) || 'popular');
  const my = searchParams.get('my') === '1';

  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [invCount, setInvCount] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    fetchCategories(headersRef.current).then(setCats).catch(console.error);
    listMyInvites(headersRef.current).then(arr => setInvCount(arr.length)).catch(()=>{});
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
      const { items: pageItems = [], nextCursor } = await listPages(
        { q: q.trim(), categoryId: categoryId || undefined, sort, my: my ? 1 : undefined, cursor: reset ? undefined : cursor, limit: 12 },
        headersRef.current
      );
      setItems(prev => (prev ? [...prev, ...pageItems] : pageItems));
      setCursor(nextCursor ?? null);
      if (!nextCursor || pageItems.length === 0) setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="col-span-12 md:col-span-3">
         <PagesSidebar/>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="col-span-12 md:col-span-9">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages…" className="max-w-sm" />
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
              <Link key={it.page_id ?? it.pageId} to={`/pages/${it.page_name}`} className="bg-white rounded-lg shadow hover:shadow-md transition">
                <div className="aspect-[3/1] bg-gray-200 rounded-t-lg overflow-hidden">
                  {it.page_cover && <img src={`${API_BASE_URL}/uploads/${it.page_cover}`} className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                      {it.page_picture && <img src={`${API_BASE_URL}/uploads/${it.page_picture}`} className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{it.page_title}</div>
                      <div className="text-xs text-gray-500 truncate">@{it.page_name}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">{it.page_likes} likes</div>
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
