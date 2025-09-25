// ReelCard.tsx — auto-next on video end
import { useEffect, useRef, useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, X } from 'lucide-react';
import type { Reel, ReelComment } from '@/services/reelService';
import { getReelComments, addReelComment } from '@/services/reelService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { stripUploads } from '@/lib/url';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
const DEFAULT_AVATAR = `${API_BASE_URL}/uploads//profile/defaultavatar.png`;

type Props = {
  reel: Reel;
  onLike: (id: number) => void;
  onShare: (id: number) => void;
  active: boolean;
  /** Parent will move focus/active to next reel */
  onEndedNext?: (id: number) => void;
};

export default function ReelCard({ reel, onLike, onShare, active, onEndedNext }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [comments, setComments] = useState<ReelComment[]>([]);
  const [openComments, setOpenComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!videoRef.current) return;
    if (active) {
      try { videoRef.current.currentTime = 0; } catch {}
      // Muted ensures autoplay policies allow play
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      try { videoRef.current.currentTime = 0; } catch {}
    }
  }, [active]);

  const handleEnded = () => {
    if (onEndedNext) {
      onEndedNext(reel.id);
      return;
    }
    // Fallback: scroll to next card in DOM
    const currentCard = rootRef.current?.closest('[data-reel-card]') as HTMLElement | null;
    const nextCard = currentCard?.nextElementSibling as HTMLElement | null;
    if (nextCard) {
      nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const nextVideo = nextCard.querySelector('video') as HTMLVideoElement | null;
      if (nextVideo) {
        nextVideo.muted = true;
        setTimeout(() => nextVideo.play().catch(() => {}), 250);
      }
    }
  };

  const loadComments = async () => {
    const rows = await getReelComments(reel.id, headers);
    setComments(rows);
  };

  const toggleComments = () => {
    setOpenComments(prev => {
      const next = !prev;
      if (next && comments.length === 0) loadComments().catch(console.error);
      return next;
    });
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const c = await addReelComment(reel.id, commentText.trim(), headers);
    setComments(prev => [...prev, c]);
    setCommentText('');
  };

  const avatarSrc = (img?: string | null) =>
    img ? `${API_BASE_URL}/uploads/${stripUploads(img)}` : DEFAULT_AVATAR;

  return (
    <div
      ref={rootRef}
      data-reel-card
      className={`mx-auto w-full md:max-w-[820px] ${openComments ? 'md:max-w-[820px]' : 'md:max-w-[480px]'}`}
    >
      <div className={openComments ? 'md:grid md:grid-cols-[420px,360px] md:gap-5' : ''}>
        {/* LEFT: video card */}
        <div className="relative w-full max-w-[420px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-xl mx-auto">
          <video
            ref={videoRef}
            src={`${API_BASE_URL}/uploads/${stripUploads(reel.videoUrl)}`}
            className="h-full w-full object-cover"
            playsInline
            muted
            // Do NOT loop — we want to advance
            onEnded={handleEnded}
            controls={false}
          />

          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
            <div className="text-sm font-semibold">{reel.authorUsername}</div>
            {reel.caption && <div className="text-sm opacity-90 line-clamp-2">{reel.caption}</div>}
          </div>

          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 text-white">
            <button
              onClick={() => onLike(reel.id)}
              className={`p-3 rounded-full bg-black/50 hover:bg-black/60 ${reel.hasLiked ? 'text-blue-400' : ''}`}
            >
              <ThumbsUp />
            </button>
            <div className="text-xs">{reel.likeCount}</div>

            <button onClick={toggleComments} className="p-3 rounded-full bg-black/50 hover:bg-black/60">
              <MessageSquare />
            </button>
            <div className="text-xs">{reel.commentCount}</div>

            <button onClick={() => onShare(reel.id)} className="p-3 rounded-full bg-black/50 hover:bg-black/60">
              <Share2 />
            </button>
            <div className="text-xs">{reel.shareCount}</div>
          </div>
        </div>

        {/* RIGHT: comments (desktop) */}
        {openComments && (
          <aside className="hidden md:flex flex-col h-[calc(100vh-160px)] w-[360px] bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold">Comments</div>
              <button onClick={() => setOpenComments(false)} className="p-1 rounded hover:bg-gray-100" aria-label="Close comments">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {comments.length === 0 && <div className="text-sm text-gray-500">Be the first to comment</div>}
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-3">
                  <img
                    src={avatarSrc((c as any).profileImage)}
                    alt={c.username}
                    className="h-8 w-8 rounded-full object-cover border"
                    onError={e => ((e.currentTarget.src = DEFAULT_AVATAR))}
                  />
                  <div>
                    <div className="text-sm font-medium leading-none">{c.username}</div>
                    <div className="text-sm mt-1">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={postComment} className="sticky bottom-0 bg-white border-t p-3">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment…"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </form>
          </aside>
        )}
      </div>

      {/* MOBILE bottom sheet */}
      {openComments && (
        <div className="md:hidden inset-x-0 bottom-0 h-[60vh] bg-white rounded-t-2xl z-50 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="font-semibold">Comments</div>
            <button onClick={() => setOpenComments(false)} className="p-1 rounded hover:bg-gray-100" aria-label="Close comments">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {comments.length === 0 && <div className="text-sm text-gray-500">Be the first to comment</div>}
            {comments.map(c => (
              <div key={c.id} className="flex items-start gap-3">
                <img
                  src={avatarSrc((c as any).profileImage)}
                  alt={c.username}
                  className="h-8 w-8 rounded-full object-cover border"
                  onError={e => ((e.currentTarget.src = DEFAULT_AVATAR))}
                />
                <div>
                  <div className="text-sm font-medium leading-none">{c.username}</div>
                  <div className="text-sm mt-1">{c.content}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={postComment} className="sticky bottom-0 bg-white border-t p-3">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </form>
        </div>
      )}
    </div>
  );
}
