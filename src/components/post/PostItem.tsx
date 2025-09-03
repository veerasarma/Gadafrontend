import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePost } from '@/contexts/PostContext';
import { Link } from 'react-router-dom';
import { Post } from '@/types';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShareModal } from '@/components/ui/ShareModal';
import { stripUploads } from '@/lib/url';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Send, Bookmark, BookmarkMinus, Rocket, ShieldAlert, Pencil, Delete } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { toast } from 'sonner';
import { encodeId } from "@/lib/idCipher";
import EditPostModal from "@/components/post/EditPostModal";
import ReportPostModal from "@/components/post/ReportPostModal";



const API_BASE_RAW = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
const API_BASE = API_BASE_RAW.replace(/\/+$/, '');

// ---- Reactions catalog singleton (shared across ALL PostItem instances) ----
type ReactionItem = { reaction: string; title: string; color?: string | null; image: string };


const FALLBACK_REACTIONS: ReactionItem[] = [
  { reaction: "like",  title: "Like",  image: "" },
  { reaction: "love",  title: "Love",  image: "" },
  { reaction: "haha",  title: "Haha",  image: "" },
  { reaction: "yay",   title: "Yay",   image: "" },
  { reaction: "wow",   title: "Wow",   image: "" },
  { reaction: "sad",   title: "Sad",   image: "" },
  { reaction: "angry", title: "Angry", image: "" },
];

const EMOJI: Record<string,string> = {
  like:"👍", love:"❤️", haha:"😆", yay:"🤩", wow:"😲", sad:"😢", angry:"😡",
};


let RX_CACHE: ReactionItem[] | null = null;     // resolved data
let RX_KEY: string | null = null;               // which Authorization token it was fetched with
let RX_PROMISE: Promise<ReactionItem[]> | null = null; // de-dup concurrent calls
let RX_FETCHED_AT = 0;
const RX_TTL_MS = 12 * 60 * 60 * 1000;          // 12h (adjust/0 to disable TTL)

async function loadReactionsCatalogOnce(apiBase: string, authKey: string) {
  const now = Date.now();
  const isFresh = RX_CACHE && RX_KEY === authKey && now - RX_FETCHED_AT < RX_TTL_MS;
  if (isFresh) return RX_CACHE!;
  if (RX_PROMISE) return RX_PROMISE;

  RX_PROMISE = fetch(`${apiBase}/api/posts/getreactions`, {
    headers: authKey ? { Authorization: authKey } : undefined,
  })
    .then(async (r) => {
      if (!r.ok) throw new Error(`getreactions ${r.status}`);
      const j = await r.json();
      RX_CACHE = Array.isArray(j?.data) ? j.data : [];
      RX_KEY = authKey;
      RX_FETCHED_AT = Date.now();
      return RX_CACHE;
    })
    .finally(() => { RX_PROMISE = null; });

  return RX_PROMISE;
}

// Optional helper if you want an immediate paint with cached data:
function getReactionsCache() { return RX_CACHE; }

const seenViewIds = new Set<string>();
let pendingViewIds = new Set<string>();
let flushHandle: number | null = null;

async function flushBatch(authHeaders: Record<string, string>) {
  const ids = Array.from(pendingViewIds);
  pendingViewIds.clear();
  flushHandle = null;
  if (!ids.length) return;
  try {
    await fetch(`${API_BASE}/api/postsviews/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ ids }),
    });
  } catch {}
}
function queueView(postId: string, authHeaders: Record<string, string>) {
  if (seenViewIds.has(postId)) return;
  seenViewIds.add(postId);
  pendingViewIds.add(postId);
  if (!flushHandle) flushHandle = window.setTimeout(() => flushBatch(authHeaders), 1200);
}

const resolveMediaUrl = (url: string) => {
  if (!url) return `${API_BASE}/uploads/profile/defaultavatar.png`;
  if (url.startsWith('http')) return url;
  const clean = stripUploads(url);
  return `${API_BASE}/uploads/${clean}`;
};

interface PostItemProps {
  post: Post & { boosted?: any; boostedBy?: any };
  trackViews?: boolean;
}

const fmt = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" :
  n >= 1_000 ? (n / 1_000).toFixed(1) + "K" : String(n);

// Collapsible text for long posts (no Tailwind line-clamp plugin needed)
function CollapsibleText({
  text,
  maxLines = 6,        // ~6 lines before clamping
  charThreshold = 400, // only clamp if text is long
}: {
  text: string;
  maxLines?: number;
  charThreshold?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsClamp = (text?.length || 0) > charThreshold;

  // ~1.5rem line-height (leading-6). Adjust if you change the line-height class.
  const maxHeightRem = `${(maxLines * 1.5).toFixed(1)}rem`;

  return (
    <div className="mb-3">
      <div className="relative">
        <p
          className="whitespace-pre-line break-words leading-6 text-[15px] overflow-hidden"
          style={!expanded && needsClamp ? { maxHeight: maxHeightRem } : undefined}
        >
          {text}
        </p>

        {/* soft fade when clamped */}
        {!expanded && needsClamp && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {needsClamp && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="mt-2 text-[#1877F2] font-medium hover:underline"
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
}

// === Multi-reaction picker (inline) ===
type ReactionCount = { reaction: string; c: number };
type ReactionCatalog = { reaction: string; title: string; color: string | null; image: string }[];

function ReactionPickerInline({
  open, catalog, onPick, onClear
}: {
  open: boolean;
  catalog: ReactionItem[];
  onPick: (rx: string) => void;
  onClear?: () => void;
}) {
  if (!open) return null;
  const items = catalog?.length ? catalog : FALLBACK_REACTIONS;

  return (
    <div className="relative z-[80] select-none ">
      <div
        className="
          inline-flex w-max min-w-[240px] shrink-0
          items-center bg-white rounded-full px-4 py-2
          border border-slate-200 shadow-2xl ml-[220px]
        "
        role="menu"
        aria-label="Choose a reaction"
      >
        <div className="flex items-center gap-2 w-max shrink-0">
          {items.map(r => (
            <button
              key={r.reaction}
              type="button"
              onClick={() => onPick(r.reaction)}
              className="
                rounded-full h-9 w-9 flex items-center justify-center
                hover:scale-110 transition first:ml-1 last:mr-1
              "
              title={r.title}
              aria-label={r.title}
            >
              {r.image ? (
                <img
                  src={`${API_BASE}/uploads/${String(r.image).replace(/^\/+/, "")}`}
                  alt={r.title}
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    const span = document.createElement("span");
                    span.textContent = EMOJI[r.reaction] ?? "👍";
                    span.style.fontSize = "20px";
                    (e.currentTarget.parentElement as HTMLElement)?.appendChild(span);
                  }}
                />
              ) : (
                <span style={{ fontSize: 20 }}>{EMOJI[r.reaction] ?? "👍"}</span>
              )}
            </button>
          ))}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="ml-1 text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {/* Pointer */}
      <div className="mx-auto h-3 w-3 -mt-1 rotate-45 bg-white border-r border-b border-slate-200 shadow" />
    </div>
  );
}

export function PostItem({ post, trackViews = true }: PostItemProps) {
  const { user, accessToken } = useAuth();
  
  const authHeaders = useAuthHeader(accessToken);
  const { likePost, commentPost, deletePost, sharePost, toggleSave } = usePost();


  const [commentContent, setCommentContent] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);



  const commentsArray = Array.isArray(post?.comments) ? post.comments : [];
  const commentsCount = commentsArray.length || Number(post?.comments ?? 0);
  const sharesCount = Number(post?.shareCount ?? post?.shares ?? 0);
  const views = Number(post?.views ?? post?.views ?? post?.viewCount ?? 0);

  // boosted state (local, with fallback to post.boosted)
  const [boostBusy, setBoostBusy] = useState(false);
  const [boosted, setBoosted] = useState<boolean>(String(post.boosted) === '1' || post.boosted === true);
  const [editOpen, setEditOpen] = useState(false);

  const postAuthor = post.author;

  const isLikedByCurrentUser =
    !!user && (
      post?.hasLiked === true ||
      post?.likes?.some(l => String(l.userId) === String(user.id))
    );

    // --- Multi-reaction state (non-breaking fallback to old likes) ---
const [catalog, setCatalog] = useState<ReactionCatalog[]>([] as any) as any; // TS relax
const [pickerOpen, setPickerOpen] = useState(false);
const [hoverLike, setHoverLike] = useState(false);
const [hoverPicker, setHoverPicker] = useState(false);
const hideTimerRef = useRef<number | null>(null);


function scheduleMaybeClose() {
  setPickerOpen(false)
  console.log('calling this')
  if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
  console.log('here')
  hideTimerRef.current = window.setTimeout(() => {
    console.log('this fun ')
    if (!hoverLike && !hoverPicker) setPickerOpen(false);
  }, 120); // small grace period feels natural
}

const initialReactions: ReactionCount[] = useMemo(() => {
  const rx = (post as any).reactions as ReactionCount[] | undefined;
  if (rx && Array.isArray(rx)) return rx.map(r => ({ reaction: r.reaction, c: Number(r.c || 0) }));
  const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;
  return likeCount > 0 ? [{ reaction: 'like', c: likeCount }] : [];
}, [post]);

const initialMyReaction: string | null = useMemo(() => {
  const mine = (post as any).myReaction as string | undefined;
  if (typeof mine === 'string') return mine;
  return isLikedByCurrentUser ? 'like' : null;
}, [post, isLikedByCurrentUser]);

const [reactions, setReactions] = useState<ReactionCount[]>(initialReactions);
const [myReaction, setMyReaction]   = useState<string | null>(initialMyReaction);


useEffect(() => {
  setReactions(initialReactions);
  setMyReaction(initialMyReaction);
}, [initialReactions, initialMyReaction]);

const totalReacts = useMemo(() => reactions.reduce((n, r) => n + Number(r.c || 0), 0), [reactions]);

// Load reaction catalog once (if endpoint exists). Falls back silently if it fails.
const authKey = useMemo(
  () => (authHeaders as any)?.Authorization ?? "",
  [(authHeaders as any)?.Authorization]
);

// (optional) show cached data instantly to avoid a flash
useEffect(() => {
  const cached = getReactionsCache();
  if (cached) setCatalog(cached);
}, []);

// fetch once per app (and per token/TTL), shared by ALL PostItem instances
useEffect(() => {
  let alive = true;
  if (!authKey) return;
  loadReactionsCatalogOnce(API_BASE, authKey)
    .then((data) => { if (alive) setCatalog(data); })
    .catch(() => {/* silently ignore */});
  return () => { alive = false; };
}, [authKey]);

function applyLocalCounts(prev: string | null, next: string | null) {
  const map = new Map<string, number>();
  for (const row of reactions) map.set(row.reaction, Number(row.c || 0));
  if (prev) map.set(prev, Math.max(0, (map.get(prev) || 0) - 1));
  if (next) map.set(next, (map.get(next) || 0) + 1);
  const merged: ReactionCount[] = Array.from(map.entries()).map(([reaction, c]) => ({ reaction, c }));
  setReactions(merged.filter(r => r.c > 0));
}

async function pickReaction(rx: string) {
  // If catalog isn't loaded, preserve your existing likePost behavior
  if (!user) return;
  if (!catalog.length && rx === 'like') {
    await likePost(post.id);
    return;
  }
  const was = myReaction;
  try {
    setMyReaction(rx);
    applyLocalCounts(was, rx);
    const res = await fetch(`${API_BASE}/api/posts/${post.id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ reaction: rx }),
    });
    if (res.ok) {
      const j = await res.json();
      if (j?.counts) setReactions(j.counts);
      if (typeof j?.myReaction !== 'undefined') setMyReaction(j.myReaction);
    }
  } catch {
    setMyReaction(was);
    applyLocalCounts(rx, was);
  } finally {
    setPickerOpen(false);
  }
}

async function clearReaction() {
  if (!user || !myReaction) return;
  const was = myReaction;
  try {
    setMyReaction(null);
    applyLocalCounts(was, null);
    const res = await fetch(`${API_BASE}/api/posts/${post.id}/react`, {
      method: 'DELETE',
      headers: { ...authHeaders },
    });
    if (res.ok) {
      const j = await res.json();
      if (j?.counts) setReactions(j.counts);
      setMyReaction(j?.myReaction ?? null);
    }
  } catch {
    setMyReaction(was);
    applyLocalCounts(null, was);
  } finally {
    setPickerOpen(false);
  }
}


  // Can boost? author + active package
  // const userHasActivePackage = useMemo(
  //   () => Boolean((user as any)?.packageActive ?? (user as any)?.activePackage ?? (user as any)?.isPro ?? (user as any)?.hasActivePackage ?? false),
  //   [user]
  // );

  const canBoost = !!user && String(user.id) === String(postAuthor.id) && user.packageactive;


  // ---- View tracking
  const viewRef = useRef<HTMLDivElement | null>(null);
  function getScrollParent(node: HTMLElement | null): Element | null {
    let el = node?.parentElement || null;
    while (el && el !== document.body) {
      const oy = getComputedStyle(el).overflowY;
      if (/(auto|scroll|overlay)/i.test(oy)) return el;
      el = el.parentElement;
    }
    return null;
  }
  function isVisible(entry: IntersectionObserverEntry, minRatio = 0.75) {
    const supported = typeof (entry as any).isIntersecting === 'boolean'
      ? (entry as any).isIntersecting
      : entry.intersectionRatio > 0;
    return supported && entry.intersectionRatio >= minRatio;
  }
  useEffect(() => {
    if (!trackViews) return;
    const el = viewRef.current;
    if (!el || typeof window === 'undefined') return;
    let dwellTimer: number | null = null;
    const root = getScrollParent(el);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target !== el) continue;
          if (isVisible(entry, 0.75)) {
            if (dwellTimer) clearTimeout(dwellTimer);
            dwellTimer = window.setTimeout(() => {
              queueView(String(post.id), authHeaders);
              io.unobserve(el);
            }, 1000);
          } else {
            if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
          }
        }
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    io.observe(el);
    return () => { if (dwellTimer) clearTimeout(dwellTimer); io.disconnect(); };
  }, [post.id, authHeaders, trackViews]);

  const handleLike = () => { if (user) likePost(post.id); };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentContent.trim()) return;
    commentPost(post.id, commentContent);
    setCommentContent('');
  };

  const handleDeletePost = () => { if (user) deletePost(post.id); };

  const handleToggleSave = async () => {
    setSaving(true);
    try {
      await toggleSave(post.id, post.hasSaved);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBoost = async () => {
    if (!canBoost || boostBusy) return;
    setBoostBusy(true);
    const next = !boosted;
    try {
      const url = `${API_BASE}/api/posts/${post.id}/boost`;
      const r = await fetch(url, {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
      });
      if (!r.ok) {
        const msg = await r.json().catch(() => ({}));
        throw new Error(msg?.error || 'Boost error');
      }
      setBoosted(next);
      toast.success(next ? 'This post is now boosted.' : 'This post is no longer boosted.');

    } catch (e: any) {
      console.error(e);
      toast.success(e?.message || 'Please try again.')
      
    } finally {
      setBoostBusy(false);
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div ref={viewRef}>
      <Card className="mb-4">
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center">
            {/* LEFT: author */}
            <div className="flex items-center space-x-3">
              <Link to={`/profile/${encodeId(postAuthor.id)}`}>
                <Avatar>
                  <AvatarImage
                    src={postAuthor.profileImage ? resolveMediaUrl(postAuthor.profileImage) : `${API_BASE}/uploads/profile/defaultavatar.png`}
                    alt={postAuthor.username}
                  />
                  <AvatarFallback>{getInitials(postAuthor.username)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="leading-tight">
                <Link to={`/profile/${postAuthor.id}`} className="font-semibold hover:underline">
                  {postAuthor.username}
                </Link>
                <p className="text-sm text-gray-500">{(post.boosted=='1')?'Sponsored':formatDate(post.createdAt)}</p>
              </div>
            </div>

            {/* RIGHT: menu */}
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" aria-label="Post options">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  {/* Save / Unsave */}
                  <DropdownMenuItem onClick={handleToggleSave} disabled={saving} className="flex items-center gap-2">
                    {post.hasSaved
                      ? <BookmarkMinus className="w-4 h-4 text-gray-600" />
                      : <Bookmark className="w-4 h-4 text-gray-600" />
                    }
                    <span>{post.hasSaved ? 'Unsave Post' : 'Save Post'}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-gray-600">
                      <ShieldAlert size={16}/>   Report post
                    </DropdownMenuItem>

                  {/* Boost / Unboost (only if author + package active) */}
                  {canBoost && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleToggleBoost} disabled={boostBusy} className="flex items-center gap-2">
                        <Rocket className={`w-4 h-4 ${post.boosted ? 'text-[#1877F2]' : 'text-gray-600'}`} />
                        <span>{post.boosted ? 'Unboost this post' : 'Boost this post'}</span>
                      </DropdownMenuItem>
                    </>
                  )}

                {user && String(user.id) === String(postAuthor.id) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditOpen(true)} className="text-gray-600">
                      <Pencil size={16}/> Edit post 
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Delete (author only) */}
                  {user && String(user.id) === String(postAuthor.id) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDeletePost} className="text-red-600">
                       <Delete size={16}></Delete> Delete post
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
    
          {post.content && <CollapsibleText text={post.content} maxLines={6} charThreshold={400} />}

          {/* Images */}
          {post.images.length > 0 && (
            <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mb-3`}>
              {post.images.map((img, i) => (
                <img
                  key={i}
                  src={resolveMediaUrl(img)}
                  alt="Post"
                  className="rounded-md w-full object-cover"
                  style={{ maxHeight: post.images.length === 1 ? '500px' : '250px' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = `${API_BASE}/uploads/profile/defaultavatar.png`; }}
                />
              ))}
            </div>
          )}

          {/* Videos */}
          {post.videos.length > 0 && (
            <div className="mb-3">
              {post.videos.map((vid, i) => (
                <video key={i} src={resolveMediaUrl(vid)} controls className="rounded-md w-full" style={{ maxHeight: '500px' }} />
              ))}
            </div>
          )}

        </CardContent>

        {true && (
          <CardContent className="px-4 pt-3 pb-0">
            <div className="flex items-center justify-between text-sm text-slate-600">
              {/* Reactions cluster + total */}
              <div className="flex items-center">
                <div className="flex -space-x-1">
                  {reactions
                    .slice()
                    .sort((a, b) => Number(b.c || 0) - Number(a.c || 0))
                    .slice(0, 3)
                    .map((r) => {
                      const def = catalog.find(c => c.reaction === r.reaction);
                      const img = def?.image || `reactions/${r.reaction}.png`;
                      return (
                        <img
                          key={r.reaction}
                          src={`${API_BASE}/uploads/${String(img).replace(/^\/+/, "")}`}
                          alt={def?.title || r.reaction}
                          title={`${def?.title || r.reaction} • ${r.c}`}
                          className="h-5 w-5 rounded-full ring-2 ring-white"
                        />
                      );
                    })}
                </div>
                {totalReacts > 0 && <span className="ml-2">{fmt(totalReacts)}</span>}
              </div>

              <div className="flex items-center gap-4 text-slate-500">
                <div>{fmt(commentsCount)} {commentsCount === 1 ? "comment" : "comments"}</div>
                <div>{fmt(sharesCount)} {sharesCount === 1 ? "Share" : "Shares"}</div>
                <div>{fmt(views)} {views === 1 ? "View" : "Views"}</div>
              </div>
            </div>
          </CardContent>
        )}

        <Separator />

        {/* Actions */}
        {/* Actions: Like / Comment / Share / Views (read-only) */}
        <CardFooter className="p-0 overflow-visible">
          <div className="relative grid grid-cols-4 w-full divide-x divide-slate-100">
            {/* LIKE / REACT */}
            <div className="relative" onMouseEnter={() => { setHoverLike(true); setPickerOpen(true); }}
      onMouseLeave={() => { setHoverLike(false); scheduleMaybeClose(); }}>
              <Button
                variant="ghost"
                onClick={() => { if (catalog.length) setPickerOpen(v => !v); else if (user) pickReaction("like"); }}
                aria-pressed={Boolean(myReaction)}
                className={`w-full h-11 rounded-none flex items-center justify-center gap-2 transition-colors ${
                  myReaction ? "text-[#1877F2]" : "text-slate-600"
                }`}
                title={myReaction ? `You reacted (${myReaction})` : "Like"}
              >
                <ThumbsUp className={`h-5 w-5 ${myReaction ? "fill-[#1877F2] text-[#1877F2]" : ""}`} />
                <span className="font-medium">
                  {myReaction ? (catalog.find(c => c.reaction === myReaction)?.title || "Like") : "Like"}
                </span>
              </Button>

              {/* Picker bubble above Like */}
              {catalog.length > 0 && pickerOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-3 -mt-4 z-50" onMouseEnter={() => { setHoverPicker(true); }}
                onMouseLeave={() => { setHoverPicker(false); scheduleMaybeClose(); }}>
                  <ReactionPickerInline
                    open={pickerOpen}
                    catalog={catalog}
                    onPick={(rx) => { setPickerOpen(false); pickReaction(rx); }}
                    onClear={myReaction ? () => { setPickerOpen(false); clearReaction(); } : undefined}
                  />
                </div>
              )}
            </div>

            {/* COMMENT */}
            <div>
              <Button
                variant="ghost"
                // TODO: wire to your existing comment toggle if you have it
                className="w-full h-11 rounded-none flex items-center justify-center gap-2 text-slate-600"  onClick={() => setIsCommenting(!isCommenting)}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">Comment</span>
              </Button>
            </div>

            {/* SHARE */}
            <div>
              <Button
                variant="ghost"
                // TODO: open your existing Share modal here
                className="w-full h-11 rounded-none flex items-center justify-center gap-2 text-slate-600"  onClick={() => setModalOpen(true)}
              >
                <Share2 className="h-5 w-5" />
                <span className="font-medium">Share</span>
              </Button>
            </div>

            {/* VIEWS (read-only) */}
            <div>
              <div className="w-full h-11 rounded-none flex items-center justify-center gap-2 text-slate-600 select-none">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path fill="currentColor" d="M12 5c5.5 0 9.5 4.5 10 6-.5 1.6-4.5 6-10 6S2.5 12.6 2 11c.5-1.6 4.5-6 10-6Zm0 2c-3.7 0-6.8 2.7-7.7 4 .9 1.3 4 4 7.7 4s6.8-2.7 7.7-4c-.9-1.3-4-4-7.7-4Zm0 2.5A3.5 3.5 0 1 1 8.5 13 3.5 3.5 0 0 1 12 9.5Zm0 2a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 12 11.5Z"/>
                </svg>
                <span className="font-medium">{fmt(views)}</span>
              </div>
            </div>
          </div>
        </CardFooter>

        <ShareModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onShare={(comment) => sharePost(post.id, comment)} />

        <ReportPostModal
  open={reportOpen}
  onOpenChange={setReportOpen}
  postId={Number(post?.id ?? post?.post_id)}
/>

         <EditPostModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          postId={post?.id ?? post?.post_id}
          initialText={post?.content ?? ""}
          initialPrivacy={post?.privacy ?? "public"}
          authKey={(authHeaders as any)?.Authorization ?? ""}
          onSaved={(updated) => {post.content = updated.text; console.log(updated,'updatedupdated')}}
        />
        

        {(post.comments.length > 0 || isCommenting) && (
          <div className="p-4 pt-0">
            <Separator className="my-4" />
            {post.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {(showAllComments ? post.comments : post.comments.slice(0, 2)).map(c => (
                  <div key={c.id} className="flex space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={resolveMediaUrl(c.profileImage || '')} alt={c.username} />
                      <AvatarFallback>{getInitials(c.username)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-2 px-3">
                        <Link to={`/profile/${c.userId}`} className="font-semibold hover:underline">{c.username}</Link>
                        <p className="text-sm">{c.content}</p>
                      </div>
                      <div className="flex space-x-3 text-xs text-gray-500 mt-1 ml-2">
                        <span>{formatDate(c.createdAt)}</span>
                        <button className="hover:text-[#1877F2]">Like</button>
                        <button className="hover:text-[#1877F2]">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
                {post.comments.length > 2 && (
                  <Button variant="ghost" onClick={() => setShowAllComments(!showAllComments)} className="text-gray-600 pl-0 pb-0">
                    {showAllComments ? 'Show fewer comments' : `View all ${post.comments.length} comments`}
                  </Button>
                )}
              </div>
            )}
            {(isCommenting || post.comments.length > 0) && user && (
              <form onSubmit={handleComment} className="flex space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={resolveMediaUrl(user.profileImage || '')} alt={user.username} />
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentContent}
                    onChange={e => setCommentContent(e.target.value)}
                    className="flex-1 resize-none min-h-[40px] max-h-[120px] focus-visible:ring-[#1877F2] rounded-full py-2"
                  />
                  <Button type="submit" size="icon" disabled={!commentContent.trim()} className="ml-2">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

