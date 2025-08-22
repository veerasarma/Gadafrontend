// src/pages/PageView.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { Button } from '@/components/ui/button';
import { Loader2, ThumbsUp } from 'lucide-react';
import { PostItem } from '@/components/post/PostItem';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  getPage, togglePageLike, fetchPagePosts, createPagePost,
  updatePageCover, updatePagePicture
} from '@/services/pagesService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export default function PageView() {
  const { handle } = useParams<{ handle: string }>();
  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  // summary
  const [summary, setSummary] = useState<any|null>(null);
  const [loading, setLoading] = useState(true);
  const [likeBusy, setLikeBusy] = useState(false);

  // posts
  const [posts, setPosts] = useState<any[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [pLoading, setPLoading] = useState(false);
  const [done, setDone] = useState(false);

  // composer (admins only)
  const isAdmin = !!summary?.admins?.some((a:any) => String(a.id) === String(user?.id)) || (summary?.page?.adminId === user?.id);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!accessToken || !handle) return;
    let cancelled = false;
    setLoading(true);
    getPage(handle, headersRef.current)
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [accessToken, handle]);

  useEffect(() => {
    if (!accessToken || !handle) return;
    setPosts(null); setCursor(null); setDone(false);
    Promise.resolve().then(() => loadMore(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, handle]);

  const loadMore = async (reset=false) => {
    if (!handle) return;
    if (pLoading) return;
    if (!reset && done) return;
    setPLoading(true);
    try {
      const { items = [], nextCursor } = await fetchPagePosts(handle, { cursor: reset ? null : cursor, limit: 10 }, headersRef.current);
      setPosts(prev => (prev ? [...prev, ...items] : items));
      setCursor(nextCursor ?? null);
      if (!nextCursor || items.length === 0) setDone(true);
    } finally {
      setPLoading(false);
    }
  };

  const onToggleLike = async () => {
    if (!summary) return;
    if (likeBusy) return;
    setLikeBusy(true);
    try {
      const { hasLiked } = await togglePageLike(summary.page.id ?? summary.page.name, headersRef.current);
      setSummary((prev:any) => {
        if (!prev) return prev;
        const likes = Math.max(0, Number(prev.page.likes || 0) + (hasLiked ? 1 : -1));
        return { ...prev, hasLiked, page: { ...prev.page, likes } };
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLikeBusy(false);
    }
  };

  const onCreatePost = async () => {
    if (!content.trim()) return;
    try {
      await createPagePost(handle!, { content }, headersRef.current);
      setContent('');
      // reload first page quickly
      setPosts(null); setCursor(null); setDone(false);
      Promise.resolve().then(() => loadMore(true));
    } catch (e) {
      console.error(e);
    }
  };

  const onChangePicture = async (file?: File|null) => {
    if (!file) return;
    try {
      const { picture } = await updatePagePicture(handle!, file, headersRef.current);
      setSummary((prev:any)=> prev ? ({ ...prev, page: { ...prev.page, picture } }) : prev);
    } catch (e) { console.error(e); }
  };

  const onChangeCover = async (file?: File|null) => {
    if (!file) return;
    try {
      const { cover } = await updatePageCover(handle!, file, headersRef.current);
      setSummary((prev:any)=> prev ? ({ ...prev, page: { ...prev.page, cover } }) : prev);
    } catch (e) { console.error(e); }
  };

  const likeActive = !!summary?.hasLiked;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* header */}
      {loading ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-gray-500">
          <Loader2 className="inline h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : !summary ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-gray-500">Page not found</div>
      ) : (
        <>
          <div className="bg-white shadow">
            <div className="max-w-5xl mx-auto">
              <div className="relative h-48 sm:h-64 bg-gray-200">
                {summary.page.cover && (
                  <img src={`${API_BASE_URL}/uploads/${summary.page.cover}`} className="w-full h-full object-cover" />
                )}
                {isAdmin && (
                  <label className="absolute right-3 bottom-3 bg-white/80 rounded px-3 py-1 text-sm cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={(e)=>onChangeCover(e.target.files?.[0])} />
                    Change cover
                  </label>
                )}
              </div>
              <div className="px-4 sm:px-6 -mt-12 sm:-mt-16 pb-4">
                <div className="flex items-end gap-4">
                  <div className="h-24 w-24 rounded-full bg-white p-1 shadow">
                    <div className="h-full w-full rounded-full overflow-hidden bg-gray-100">
                      {summary.page.picture && (
                        <img src={`${API_BASE_URL}/uploads/${summary.page.picture}`} className="w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <label className="text-sm bg-white rounded px-3 py-1 border cursor-pointer">
                      <input type="file" className="hidden" accept="image/*" onChange={(e)=>onChangePicture(e.target.files?.[0])} />
                      Change picture
                    </label>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold truncate">{summary.page.title}</div>
                    <div className="text-gray-500 truncate">@{summary.page.name}</div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={onToggleLike}
                    disabled={likeBusy}
                    className={`rounded-full ${likeActive ? 'text-[#1877F2]' : 'text-gray-700'}`}
                  >
                    <ThumbsUp className="h-5 w-5 mr-2" />
                    {likeActive ? 'Liked' : 'Like'} · {summary.page.likes}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* about + composer + posts */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
            {/* about */}
            {summary.page.description && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="font-semibold mb-1">About</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{summary.page.description}</div>
              </div>
            )}

            {/* composer (admins only) */}
            {isAdmin && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="font-semibold mb-2">Create a post as {summary.page.title}</div>
                <Textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Say something…" />
                <div className="mt-2 flex justify-end">
                  <Button onClick={onCreatePost} disabled={!content.trim()}>Post</Button>
                </div>
              </div>
            )}

            {/* posts */}
            <div className="space-y-4">
              {posts === null && pLoading && (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  <Loader2 className="inline h-4 w-4 animate-spin mr-1" /> Loading…
                </div>
              )}
              {Array.isArray(posts) && posts.map(p => (
                <PostItem key={p.id} post={p as any} />
              ))}
              {Array.isArray(posts) && posts.length === 0 && done && !pLoading && (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">No posts yet</div>
              )}
              {!done && (
                <div className="flex justify-center">
                  <Button onClick={() => loadMore(false)} disabled={pLoading}>
                    {pLoading ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
