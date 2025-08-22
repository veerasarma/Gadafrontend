import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import EventSidebar from '@/components/events/eventsidebar';
import { listEventCategories, listEvents } from '@/services/eventsService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export default function EventsIndex() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(()=>{ headersRef.current = headers; }, [headers]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState<number | ''>(searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : '');
  const [when, setWhen] = useState<'upcoming'|'today'|'week'|'month'|'past'>((searchParams.get('when') as any) || 'upcoming');

  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // sync URL -> state
  useEffect(() => {
    const nextQ = searchParams.get('q') || '';
    const nextCid = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : '';
    const nextWhen = (searchParams.get('when') as any) || 'upcoming';
    if (nextQ !== q) setQ(nextQ);
    if ((nextCid as any) !== categoryId) setCategoryId(nextCid);
    if (nextWhen !== when) setWhen(nextWhen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // state -> URL
  useEffect(() => {
    const p:any = {};
    if (q) p.q = q;
    if (categoryId) p.categoryId = categoryId;
    if (when && when !== 'upcoming') p.when = when;
    setSearchParams(p, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryId, when]);

  useEffect(() => {
    if (!accessToken) return;
    listEventCategories(headersRef.current).then(setCats).catch(()=>{});
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    setItems(null); setCursor(null); setDone(false);
    Promise.resolve().then(() => loadMore(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryId, when, accessToken]);

  const loadMore = async (reset=false) => {
    if (loading) return;
    if (!reset && done) return;
    setLoading(true);
    try {
      const { items: page, nextCursor } = await listEvents(
        { q: q.trim(), categoryId: categoryId || undefined, when, cursor: reset ? undefined : cursor, limit: 12 },
        headersRef.current
      );
      setItems(prev => (prev ? [...prev, ...page] : page));
      setCursor(nextCursor ?? null);
      if (!nextCursor || page.length === 0) setDone(true);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <EventSidebar highlight="discover" />
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search events…" className="max-w-sm" />
            <select className="border rounded px-2 py-2 bg-white" value={categoryId} onChange={(e)=>setCategoryId(e.target.value?Number(e.target.value):'')}>
              <option value="">All categories</option>
              {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
            <select className="border rounded px-2 py-2 bg-white" value={when} onChange={(e)=>setWhen(e.target.value as any)}>
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="past">Past</option>
            </select>
          </div>

          {items === null && (
            <div className="text-gray-500"><Loader2 className="inline h-4 w-4 animate-spin" /> Loading…</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(items) && items.map(ev => (
              <Link key={ev.id} to={`/events/${ev.id}`} className="bg-white rounded-lg shadow hover:shadow-md transition">
                <div className="aspect-[3/1] bg-gray-200 rounded-t-lg overflow-hidden">
                  {ev.cover && <img src={`${API_BASE_URL}/uploads/${ev.cover}`} className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <div className="font-semibold line-clamp-1">{ev.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(ev.startAt).toLocaleString()}</div>
                  <div className="text-xs text-gray-600 mt-1">{ev.location}</div>
                  <div className="text-xs text-gray-600 mt-1">{ev.stats.going} going · {ev.stats.interested} interested</div>
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
