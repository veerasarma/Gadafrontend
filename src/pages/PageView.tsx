// src/pages/PageView.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { Button } from '@/components/ui/button';
import { Loader2, ThumbsUp, UserPlus, X, FilePlus2, Inbox } from 'lucide-react';
import { PostItem } from '@/components/post/PostItem';
import { Textarea } from '@/components/ui/textarea';
import PagesSidebar from '@/components/pages/pagesSidebar';
import {
  getPage, togglePageLike, fetchPagePosts, createPagePost,
  updatePageCover, updatePagePicture,
  listPageInvites, inviteUserToPage, suggestUsers,
  fetchCategories, listMyInvites, // NEW: for sidebar
} from '@/services/pagesService';
import { stripUploads } from '@/lib/url';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export default function PageView() {
  const { handle } = useParams<{ handle: string }>();
  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  // Sidebar (same as Pages index)
  const [cats, setCats] = useState<any[]>([]);
  const [invCount, setInvCount] = useState(0);

  // Summary / like
  const [summary, setSummary] = useState<any|null>(null);
  const [loading, setLoading] = useState(true);
  const [likeBusy, setLikeBusy] = useState(false);

  // Posts
  const [posts, setPosts] = useState<any[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [pLoading, setPLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isAdmin =
    !!summary?.admins?.some((a:any) => String(a.id) === String(user?.id)) ||
    (summary?.page?.adminId === user?.id);
  const [content, setContent] = useState('');

  // Admin invites modal
  const [invites, setInvites] = useState<any[]|null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggest, setSuggest] = useState<any[]>([]);
  const [inviteBusy, setInviteBusy] = useState<number|null>(null);

  // Sidebar data
  useEffect(() => {
    if (!accessToken) return;
    fetchCategories(headersRef.current).then(setCats).catch(() => {});
    listMyInvites(headersRef.current).then(arr => setInvCount(arr.length)).catch(() => {});
  }, [accessToken]);

  // Page summary
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

  // First page posts
  useEffect(() => {
    if (!accessToken || !handle) return;
    setPosts(null); setCursor(null); setDone(false);
    void loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, handle]);

  const loadMore = async (reset=false) => {
    if (!handle) return;
    if (pLoading) return;
    if (!reset && done) return;
    setPLoading(true);
    try {
      const { items = [], nextCursor } = await fetchPagePosts(
        handle,
        { cursor: reset ? null : cursor, limit: 10 },
        headersRef.current
      );
      setPosts(prev => (prev ? [...prev, ...items] : items));
      setCursor(nextCursor ?? null);
      if (!nextCursor || items.length === 0) setDone(true);
    } finally { setPLoading(false); }
  };

  // Admin: pending invites
  useEffect(() => {
    if (!isAdmin || !handle || !accessToken) { setInvites(null); return; }
    listPageInvites(handle, headersRef.current).then(setInvites).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, handle, accessToken]);

  const onToggleLike = async () => {
    if (!summary || likeBusy) return;
    setLikeBusy(true);
    try {
      const { hasLiked } = await togglePageLike(summary.page.id ?? summary.page.name, headersRef.current);
      setSummary((prev:any) => {
        if (!prev) return prev;
        const likes = Math.max(0, Number(prev.page.likes || 0) + (hasLiked ? 1 : -1));
        return { ...prev, hasLiked, page: { ...prev.page, likes } };
      });
    } catch (e) { console.error(e); }
    finally { setLikeBusy(false); }
  };

  const onCreatePost = async () => {
    if (!content.trim()) return;
    try {
      await createPagePost(handle!, { content }, headersRef.current);
      setContent('');
      setPosts(null); setCursor(null); setDone(false);
      void loadMore(true);
    } catch (e) { console.error(e); }
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

  // Invite modal search (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      if (!inviteOpen || !query.trim()) { setSuggest([]); return; }
      suggestUsers(query.trim(), headersRef.current)
        .then(setSuggest)
        .catch(() => setSuggest([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query, inviteOpen]);

  function removeByUserIdInPlace(list, userId) {
    const idStr = String(userId);
    const i = list.findIndex(item => String(item.id) === idStr);
    if (i !== -1) list.splice(i, 1);
  }

  const sendInvite = async (userId: number) => {
    setInviteBusy(userId);
    try {
      await inviteUserToPage(handle!, userId, headersRef.current);
      removeByUserIdInPlace(suggest, userId)
    //   setQuery('');
    //   setSuggest([]);
    
      await listPageInvites(handle!, headersRef.current).then(setInvites);
    } catch (e) {
      console.error(e);
    } finally {
      setInviteBusy(null);
    }
  };

  const likeActive = !!summary?.hasLiked;

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />

      {loading ? (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-10 text-gray-500">
          <Loader2 className="inline h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : !summary ? (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-10 text-gray-500">Page not found</div>
      ) : (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
          {/* LEFT SIDEBAR — identical to Pages index/invites/create */}
          <aside className="col-span-12 md:col-span-3">
            <PagesSidebar />
          </aside>

          {/* MAIN CONTENT */}
          <main className="col-span-12 md:col-span-9">
            {/* HEADER CARD — alignment fixed */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative h-48 sm:h-64 bg-gray-200">
                {summary.page.cover && (
                  <img
                    src={`${API_BASE_URL}/uploads/${summary.page.cover}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {isAdmin && (
                  <label className="absolute right-3 bottom-3 bg-white/80 rounded px-3 py-1 text-sm cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e)=>onChangeCover(e.target.files?.[0])}
                    />
                    Change cover
                  </label>
                )}
              </div>

              <div className="px-4 sm:px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 rounded-full bg-white p-1 shadow -mt-14">
                    <div className="h-full w-full rounded-full overflow-hidden bg-gray-100">
                      {summary.page.picture && (
                        <img
                          src={`${API_BASE_URL}/uploads/${summary.page.picture}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-2xl font-bold truncate">{summary.page.title}</div>
                    <div className="text-gray-500 truncate">@{summary.page.name}</div>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={onToggleLike}
                    disabled={likeBusy}
                    className={`rounded-full ${summary?.hasLiked ? 'text-[#1877F2]' : 'text-gray-700'}`}
                  >
                    <ThumbsUp className="h-5 w-5 mr-2" />
                    {summary?.hasLiked ? 'Liked' : 'Like'} · {summary.page.likes}
                  </Button>
                </div>
              </div>
            </div>

            {/* CONTENT GRID */}
            <div className="grid grid-cols-12 gap-6 mt-6">
              {/* LEFT — About + Composer + Posts */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                {summary.page.description && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="font-semibold mb-1">About</div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {summary.page.description}
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="font-semibold mb-2">
                      Create a post as {summary.page.title}
                    </div>
                    <Textarea
                      value={content}
                      onChange={(e)=>setContent(e.target.value)}
                      placeholder="Say something…"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button onClick={onCreatePost} disabled={!content.trim()}>
                        Post
                      </Button>
                    </div>
                  </div>
                )}

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
                    <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                      No posts yet
                    </div>
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

              {/* RIGHT — Admins & Invites */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="font-semibold mb-2">Admins</div>
                  <ul className="space-y-2">
                    {summary.admins?.map((a:any) => (
                      <li key={a.id} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200">
                          {a.avatar && (
                            <img
                              src={`${API_BASE_URL}/uploads/${stripUploads(a.avatar)}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="text-sm truncate">
                          {a.fullName || a.username}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {isAdmin && (
                    <div className="mt-3">
                      <Button size="sm" onClick={() => setInviteOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" /> Invite admin
                      </Button>
                    </div>
                  )}
                </div>

                {isAdmin && invites && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="font-semibold mb-2">Pending invites</div>
                    {invites.length === 0 ? (
                      <div className="text-sm text-gray-500">No pending invites</div>
                    ) : (
                      <ul className="space-y-2">
                        {invites.map((i:any) => (
                          <li key={i.inviteId} className="text-sm flex items-center gap-2">
                            <span className="truncate">{i.toUsername}</span>
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-500">
                              invited by {i.fromUsername}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* INVITE MODAL */}
          {inviteOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow w-full max-w-md p-4 relative">
                <button
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  onClick={()=>{ setInviteOpen(false); setQuery(''); setSuggest([]); }}
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="text-lg font-semibold mb-3">Invite admin</div>
                <input
                  className="w-full border rounded px-3 py-2 mb-3"
                  placeholder="Search users…"
                  value={query}
                  onChange={e=>setQuery(e.target.value)}
                />
                <div className="max-h-64 overflow-auto -mx-2 px-2">
                  {suggest.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      Type a name or username…
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {suggest.map(u => (
                        <li key={u.id} className="py-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200">
                              {u.avatar && (
                                <img
                                  src={`${API_BASE_URL}/uploads/${stripUploads(u.avatar)}`}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {u.fullName || u.username}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                @{u.username}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={()=>sendInvite(Number(u.id))}
                            disabled={inviteBusy===Number(u.id)}
                          >
                            {inviteBusy===Number(u.id) ? '...' : 'Invite'}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
