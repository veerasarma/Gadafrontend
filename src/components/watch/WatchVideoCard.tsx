import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Share2, Volume2, VolumeX, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';
import { stripUploads } from '@/lib/url';
import { useAuth } from '@/contexts/AuthContext';
import { usePost } from '@/contexts/PostContext';
import { ShareModal } from '@/components/ui/ShareModal';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/').replace(/\/+$/, '');

export default function WatchVideoCard({
  post,
  onEnded,
}: {
  post: any;
  onEnded?: () => void;
}) {
  const { user } = useAuth();
  const { likePost, commentPost, deletePost, sharePost, toggleSave } = usePost();

  // ====== Optimistic like state (mirrors PostItem) ======
  const initialLiked = useMemo(() => {
    if (!user) return !!post?.hasLiked;
    return post?.hasLiked === true || post?.likes?.some?.((l: any) => String(l.userId) === String(user.id));
  }, [post?.hasLiked, post?.likes, user]);

  const initialCount = useMemo(() => {
    if (Array.isArray(post?.likes)) return post.likes.length;
    return Number(post?.likeCount ?? 0);
  }, [post?.likes, post?.likeCount]);

  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [likeCount, setLikeCount] = useState<number>(initialCount);
  const [likeBusy, setLikeBusy] = useState(false);

  // keep local state in sync if parent post changes (e.g., list refresh)
  useEffect(() => {
    setLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount, post?.id]);

  const isLikedByCurrentUser = liked;

  // ====== Comment / share UI state ======
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  // ====== Video autoplay/pause on visibility ======
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = hostRef.current;
    const vid = videoRef.current;
    if (!el || !vid) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.6;
        if (visible) vid.play().catch(() => {});
        else vid.pause();
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // auto-advance when video ends
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !onEnded) return;
    const handler = () => onEnded();
    vid.addEventListener('ended', handler);
    return () => vid.removeEventListener('ended', handler);
  }, [onEnded]);

  const onToggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  };

  // ====== Actions ======
  const handleLike = async () => {
    if (!user || likeBusy) return;
    const next = !liked;
    // optimistic update
    setLiked(next);
    setLikeBusy(true);
    setLikeCount(c => Math.max(0, c + (next ? 1 : -1)));
    try {
      await likePost(post.id); // server toggles like/unlike
    } catch (e) {
      // rollback on failure
      setLiked(!next);
      setLikeCount(c => Math.max(0, c + (next ? -1 : 1)));
      console.error(e);
    } finally {
      setLikeBusy(false);
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentContent.trim()) return;
    commentPost(post.id, commentContent);
    setCommentContent('');
  };

  const handleDeletePost = () => {
    if (!user) return;
    deletePost(post.id);
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div ref={hostRef}>
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="p-4 pb-2 flex items-start">
          <div className="flex-1 flex items-center space-x-3">
            <Link to={`/profile/${post.author.id}`}>
              <Avatar>
                {post.author.profileImage ? (
                  <AvatarImage src={`${API_BASE}/uploads/${stripUploads(post.author.profileImage)}`} alt={post.author.username} />
                ) : (
                  <AvatarFallback>{getInitials(post.author.username)}</AvatarFallback>
                )}
              </Avatar>
            </Link>
            <div>
              <Link to={`/profile/${post.author.id}`} className="font-semibold hover:underline">
                {post.author.username}
              </Link>
              <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            {user && String(user.id) === String(post.author.id) && (
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDeletePost} className="text-red-600">
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </CardHeader>

        <CardContent className="p-0">
          {post.content && <p className="px-4 pt-2 pb-3">{post.content}</p>}

          {/* Video */}
          <div className="relative bg-black">
            <video
              ref={videoRef}
              src={`${API_BASE}/uploads/${stripUploads(post.videos[0])}`}
              className="w-full max-h-[70vh] object-contain"
              controls={false}
              playsInline
              muted={muted}
              preload="metadata"
            />
            <button
              onClick={onToggleMute}
              className="absolute right-3 bottom-3 bg-white/80 rounded-full p-2"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>

          {/* Basic stats */}
          <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-500">
            {likeCount > 0 && (
              <div className="flex items-center space-x-1">
                <ThumbsUp className="h-4 w-4 text-[#1877F2]" />
                <span>{likeCount}</span>
              </div>
            )}
            {post.comments.length > 0 && <div>{post.comments.length} comments</div>}
            <div>{post.shareCount ?? post.shares ?? 0} shares</div>
          </div>
        </CardContent>

        <CardFooter className="p-0">
          <div className="grid grid-cols-3 w-full">
            <Button
              variant="ghost"
              onClick={handleLike}
              aria-pressed={isLikedByCurrentUser}
              disabled={likeBusy}
              className={`flex items-center justify-center py-2 rounded-none ${isLikedByCurrentUser ? 'text-[#1877F2]' : 'text-gray-600'}`}
            >
              <ThumbsUp className={`h-5 w-5 mr-1 ${isLikedByCurrentUser ? 'fill-[#1877F2] text-[#1877F2]' : ''}`} />
              Like
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsCommenting(!isCommenting)}
              className="flex items-center justify-center py-2 rounded-none text-gray-600"
            >
              <MessageSquare className="h-5 w-5 mr-1" />
              Comment
            </Button>
            <Button
              variant="ghost"
              className="flex items-center justify-center py-2 rounded-none text-gray-600"
              onClick={() => setModalOpen(true)}
            >
              <Share2 className="h-5 w-5 mr-1" />
              Share
            </Button>
          </div>
        </CardFooter>

        {/* Share modal */}
        <ShareModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onShare={(comment) => sharePost(post.id, comment)}
        />

        {/* Comments */}
        {(post.comments.length > 0 || isCommenting) && (
          <div className="p-4 pt-0">
            <div className="h-px bg-gray-200 my-4" />
            {post.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {(showAllComments ? post.comments : post.comments.slice(0, 2)).map((c: any) => (
                  <div key={c.id} className="flex space-x-2">
                    <Avatar className="h-8 w-8">
                      {c.profileImage ? (
                        <AvatarImage src={`${API_BASE}/uploads/${stripUploads(c.profileImage)}`} alt={c.username} />
                      ) : (
                        <AvatarFallback>{getInitials(c.username)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-2 px-3">
                        <Link to={`/profile/${c.userId}`} className="font-semibold hover:underline">
                          {c.username}
                        </Link>
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
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllComments(!showAllComments)}
                    className="text-gray-600 pl-0 pb-0"
                  >
                    {showAllComments ? 'Show fewer comments' : `View all ${post.comments.length} comments`}
                  </Button>
                )}
              </div>
            )}
            {(isCommenting || post.comments.length > 0) && user && (
              <form onSubmit={handleComment} className="flex space-x-2">
                <Avatar className="h-8 w-8">
                  {user.profileImage ? (
                    <AvatarImage src={`${API_BASE}/uploads/${stripUploads(user.profileImage)}`} alt={user.username} />
                  ) : (
                    <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                  )}
                </Avatar>
                <input
                  className="flex-1 rounded-full border px-3 py-2 text-sm"
                  placeholder="Write a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={!commentContent.trim()}>Post</Button>
              </form>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
