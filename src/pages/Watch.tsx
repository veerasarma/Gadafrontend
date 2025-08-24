import { useEffect, useRef, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import RightSidebar from '@/components/ui/RightSidebar';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import WatchVideoCard from '@/components/watch/WatchVideoCard';
import { fetchWatchFeed } from '@/services/watchService';

export default function WatchPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(()=>{ headersRef.current = headers; }, [headers]);

  const [items, setItems] = useState<any[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) return;
    setItems(null); setCursor(null); setDone(false);
    loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, accessToken]);

  const loadMore = async (reset=false) => {
    if (loading) return;
    if (!reset && done) return;
    setLoading(true);
    try {
      const { items: page, nextCursor } = await fetchWatchFeed(
        { limit: 8, cursor: reset ? null : cursor },
        headersRef.current
      );
      setItems(prev => (prev ? [...prev, ...page] : page));
      setCursor(nextCursor ?? null);
      if (!nextCursor || page.length === 0) setDone(true);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load when near bottom
  useEffect(() => {
    const onScroll = () => {
      if (loading || done) return;
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 800;
      if (nearBottom) loadMore(false);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading, done]);

  // advance to next when a video ends
  const onEnded = (index: number) => {
    const next = document.querySelectorAll('[data-watch-card]')[index + 1] as HTMLElement | null;
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (authLoading || items === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-cus">
      <Navbar />

      <div className="flex flex-1 overflow-hidden px-4 lg:px-8">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto space-x-6">
          {/* LEFT SIDEBAR (reuse same as feed) */}
          <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto py-6">
            <div className="sticky top-16"><Sidebar /></div>
          </aside>

          {/* CENTER WATCH FEED */}
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="space-y-6 py-6">
              {items.map((post, idx) => (
                <div key={post.id} data-watch-card>
                  <WatchVideoCard post={post} onEnded={() => onEnded(idx)} />
                </div>
              ))}

              {!done && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={() => loadMore(false)}
                    className="px-4 py-2 rounded bg-[#1877F2] text-white disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT WIDGETS */}
          <aside className="hidden xl:block xl:w-96 min-h-0 overflow-y-auto pt-6">
            <RightSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
