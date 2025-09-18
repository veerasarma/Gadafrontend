// src/pages/PageView.tsx
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { Button } from '@/components/ui/button';
import { Loader2, ThumbsUp, UserPlus, X, Rocket, ImageIcon, VideoIcon } from 'lucide-react';
import { PostItem } from '@/components/post/PostItem';
import { Textarea } from '@/components/ui/textarea';
import PagesSidebar from '@/components/pages/pagesSidebar';
import {
  getPage, togglePageLike, fetchPagePosts, createPagePost,
  updatePageCover, updatePagePicture,
  listPageInvites, inviteUserToPage, suggestUsers,
  fetchCategories, listMyInvites,
  togglePageBoost,
} from '@/services/pagesService';
import { stripUploads } from '@/lib/url';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export default function PageView() {
  const { handle } = useParams<{ handle: string }>();
  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  // Sidebar
  const [cats, setCats] = useState<any[]>([]);
  const [invCount, setInvCount] = useState(0);

  // Summary / like / boost
  const [summary, setSummary] = useState<any|null>(null);
  const [loading, setLoading] = useState(true);
  const [likeBusy, setLikeBusy] = useState(false);

  // posts
  const [posts, setPosts] = useState<any[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [pLoading, setPLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isAdmin =
    !!summary?.admins?.some((a:any) => String(a.id) === String(user?.id)) ||
    (summary?.page?.adminId === user?.id);

  // composer
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // invites
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

  // ====== NEW: media handlers ======
  function removeImage(i:number){ setImageFiles(p=>p.filter((_,x)=>x!==i)); setImagePreviews(p=>p.filter((_,x)=>x!==i)); }
  function removeVideo(i:number){ setVideoFiles(p=>p.filter((_,x)=>x!==i)); setVideoPreviews(p=>p.filter((_,x)=>x!==i)); }
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files?.length) return;
    const arr = Array.from(files);
    setImageFiles(prev=>[...prev, ...arr]);
    setImagePreviews(prev=>[...prev, ...arr.map(f=>URL.createObjectURL(f))]);
    e.target.value = '';
  };
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files?.length) return;
    const arr = Array.from(files);
    setVideoFiles(prev=>[...prev, ...arr]);
    setVideoPreviews(prev=>[...prev, ...arr.map(f=>URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const resetComposer = () => {
    setContent('');
    setImageFiles([]); setVideoFiles([]);
    setImagePreviews([]); setVideoPreviews([]);
  };

  const onCreatePost = async () => {
    if (!handle) return;
    if (!content.trim() && imageFiles.length === 0 && videoFiles.length === 0) return;
    setIsSubmitting(true);
    try {
      await createPagePost(handle, {
        content,
        images: imageFiles,
        videos: videoFiles,
      }, headersRef.current);
      resetComposer();
      // reload first page
      setPosts(null); setCursor(null); setDone(false);
      await loadMore(true);
      toast.success('Post published');
    } catch (e:any) {
      console.error(e);
      toast.error(e?.message || 'Failed to create post');
    } finally { setIsSubmitting(false); }
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

  function removeByUserIdInPlace(list:any[], userId:number) {
    const idStr = String(userId);
    const i = list.findIndex(item => String(item.id) === idStr);
    if (i !== -1) list.splice(i, 1);
  }

  const sendInvite = async (userId: number) => {
    setInviteBusy(userId);
    try {
      await inviteUserToPage(handle!, userId, headersRef.current);
      removeByUserIdInPlace(suggest, userId)
      await listPageInvites(handle!, headersRef.current).then(setInvites);
    } catch (e) {
      console.error(e);
    } finally {
      setInviteBusy(null);
    }
  };

  const likeActive = !!summary?.hasLiked;

  // ---- BOOST state derived from summary.page.page_boosted / boosted
  const initialBoosted =
    String(summary?.page?.page_boosted) === '1' ||
    String(summary?.page?.boosted) === '1' ||
    summary?.page?.boosted === true;

  const [boosted, setBoosted] = useState<boolean>(false);
  const [boostBusy, setBoostBusy] = useState(false);

  useEffect(() => {
    setBoosted(Boolean(initialBoosted));
  }, [initialBoosted]);

  const onToggleBoost = async () => {
    if (!isAdmin || !handle || boostBusy) return;
    setBoostBusy(true);
    const next = !boosted;
    try {
      await togglePageBoost(handle, next, headersRef.current);
      setBoosted(next);
      setSummary((prev:any) => prev
        ? ({ ...prev, page: { ...prev.page, page_boosted: next ? '1' : '0' } })
        : prev
      );
      toast.success(next ? 'This page is now boosted.' : 'This page is now boosted.');
    } catch (e:any) {
      console.error(e);
      toast.error(e?.message || 'Please try again');
    } finally {
      setBoostBusy(false);
    }
  };

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
          {/* LEFT SIDEBAR */}
          <aside className="col-span-12 md:col-span-3">
            <PagesSidebar />
          </aside>

          {/* MAIN */}
          <main className="col-span-12 md:col-span-9">
            {/* HEADER */}
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

                  {/* LIKE */}
                  <Button
                    variant="ghost"
                    onClick={onToggleLike}
                    disabled={likeBusy}
                    className={`rounded-full ${likeActive ? 'text-[#1877F2]' : 'text-gray-700'}`}
                  >
                    <ThumbsUp className="h-5 w-5 mr-2" />
                    {likeActive ? 'Liked' : 'Like'} · {summary.page.likes}
                  </Button>

                  {/* BOOST (admin only) */}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      onClick={onToggleBoost}
                      disabled={boostBusy}
                      className={`rounded-full ${boosted ? 'text-[#1877F2]' : 'text-gray-700'}`}
                      title={boosted ? 'Unboost page' : 'Boost page'}
                    >
                      <Rocket className="h-5 w-5 mr-2" />
                      {boosted ? 'Unboost' : 'Boost'}
                    </Button>
                  )}
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

                {/* ===== NEW: Page post composer with media ===== */}
                {isAdmin && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="font-semibold mb-2">
                      Create a post as {summary.page.title}
                    </div>

                    <Textarea
                      value={content}
                      onChange={(e)=>setContent(e.target.value)}
                      placeholder="Say something…"
                      className="resize-none min-h-[80px] focus-visible:ring-[#1877F2]"
                    />

                    {/* Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
                        {imagePreviews.map((url, idx) => (
                          <div key={idx} className="relative group rounded-md overflow-hidden">
                            <img src={url} alt={`preview-${idx}`} className="w-full h-32 object-cover" />
                            <Button type="button" variant="destructive" size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(idx)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {videoPreviews.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        {videoPreviews.map((url, idx) => (
                          <div key={idx} className="relative group rounded-md overflow-hidden">
                            <video src={url} controls className="w-full h-48 object-cover" />
                            <Button type="button" variant="destructive" size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeVideo(idx)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pickers + Post */}
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-gray-200 gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} id="page-image-upload" />
                        <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()} className="flex items-center text-gray-600" disabled={isSubmitting}>
                          <ImageIcon className="h-4 w-4 mr-1 text-[#45BD62]" /> Photo
                        </Button>

                        <Input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideoChange} id="page-video-upload" />
                        <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} className="flex items-center text-gray-600" disabled={isSubmitting}>
                          <VideoIcon className="h-4 w-4 mr-1 text-[#F3425F]" /> Video
                        </Button>
                      </div>

                      <Button onClick={onCreatePost}
                        disabled={isSubmitting || (!content.trim() && imageFiles.length === 0 && videoFiles.length === 0)}
                        className="bg-[#1877F2] hover:bg-[#166FE5] w-full sm:w-auto">
                        {isSubmitting ? (<><Loader2 className="h-4 w-4 mr-1 animate-spin" />Posting...</>) : ('Post')}
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
                            <span className="text-gray-500">invited by {i.fromUsername}</span>
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
