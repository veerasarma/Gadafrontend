// src/pages/HashtagPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { PostItem } from '@/components/post/PostItem';
import { stripUploads } from '@/lib/url';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  fetchHashtagSummary,
  fetchHashtagPosts
} from '@/services/hashtagService';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

type Summary = {
  tag: string;
  hashtagId: number | null;
  counts: { posts: number; photos: number };
  previews: { photos: string[] };
};

type Post = {
  id: string;
  author: { id: string; username: string; fullName?: string; profileImage?: string|null };
  content: string;
  createdAt: string;
  privacy: string;
  shares: number;
  images: string[];
  videos: string[];
  likes: { userId: string; username: string }[];
  comments: { id: string; userId: string; username: string; profileImage?: string|null; content: string; createdAt: string }[];
};

function normalizeTag(raw = '') {
  const s = String(raw).trim();
  return s.startsWith('#') ? s.slice(1).toLowerCase() : s.toLowerCase();
}

export default function HashtagPage() {
  const { tag: routeTag } = useParams<{ tag: string }>();
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const tag = useMemo(() => normalizeTag(routeTag || ''), [routeTag]);

  // stable headers
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  // SUMMARY
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sumLoading, setSumLoading] = useState(true);
  const [sumError, setSumError] = useState<string | null>(null);

  // POSTS
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // init guards
  const summaryInitKeyRef = useRef<string>('');
  const postsInitKeyRef = useRef<string>('');
  const inFlightRef = useRef(false);

  // load summary once per tag (when token ready)
  useEffect(() => {
    if (!tag) return;
    if (!accessToken) return;

    const key = `sum|${tag}`;
    if (summaryInitKeyRef.current === key) return;
    summaryInitKeyRef.current = key;

    setSumLoading(true);
    setSumError(null);
    let cancelled = false;

    fetchHashtagSummary(tag, headersRef.current)
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((e) => { if (!cancelled) setSumError(e?.message || 'Failed to load'); })
      .finally(() => { if (!cancelled) setSumLoading(false); });

    return () => { cancelled = true; };
  }, [tag, accessToken]);

  // load posts first page once per tag
  useEffect(() => {
    if (!tag) return;
    if (!accessToken) return;

    const key = `posts|${tag}`;
    if (postsInitKeyRef.current === key) return;
    postsInitKeyRef.current = key;

    setPosts(null);
    setCursor(null);
    setDone(false);
    Promise.resolve().then(() => loadMore(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag, accessToken]);

  const loadMore = async (reset = false) => {
    if (!tag || !accessToken) return;
    if (inFlightRef.current) return;
    if (!reset && done) return;

    inFlightRef.current = true;
    setLoading(true);
    try {
      const { items = [], nextCursor } = await fetchHashtagPosts(
        tag,
        { cursor: reset ? null : cursor, limit: 10 },
        headersRef.current
      );

      setPosts(prev => (prev ? [...prev, ...items] : items));
      setCursor(nextCursor ?? null);
      if (!nextCursor || items.length === 0) setDone(true);
    } catch (e) {
      console.error('[hashtag posts]', e);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold break-all">#{tag}</h1>
          <div className="text-gray-600 text-sm mt-1">
            {sumLoading ? 'Loading…' : `${summary?.counts.posts ?? 0} posts`}
          </div>

          {/* photo preview grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
            {(summary?.previews.photos || []).map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded bg-gray-100">
                <img
                  src={API_BASE_URL + '/uploads/' + stripUploads(src)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {!sumLoading && (summary?.previews.photos?.length ?? 0) === 0 && (
              <div className="text-gray-500 text-sm py-6 col-span-full">No photos yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* first page loading */}
        {posts === null && loading && (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            <Loader2 className="h-5 w-5 inline animate-spin mr-2" />
            Loading…
          </div>
        )}

        {/* items */}
        {Array.isArray(posts) && posts.length > 0 && (
          <>
            {posts.map((p) => (
              <PostItem key={p.id} post={p as any} />
            ))}

            {!done && (
              <div className="flex justify-center">
                <Button onClick={() => loadMore(false)} disabled={loading}>
                  {loading ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}

        {/* empty */}
        {posts !== null && posts.length === 0 && done && !loading && (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No posts for this hashtag yet
          </div>
        )}
      </div>
    </div>
  );
}
