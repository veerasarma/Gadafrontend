// import { useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { usePost } from '@/contexts/PostContext';
// import { Link } from 'react-router-dom';
// import { Post, Comment as CommentType } from '@/types';
// import { formatDate } from '@/lib/utils';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button';
// import { Textarea } from '@/components/ui/textarea';
// import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
// import { Separator } from '@/components/ui/separator';
// import { ShareModal } from '@/components/ui/ShareModal';
// import { stripUploads } from '@/lib/url';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
// import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Send, Bookmark, BookmarkMinus } from 'lucide-react';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';

// const API_URL = import.meta.env.BACKEND_API_URL || '';
// const resolveMediaUrl = (url: string) => {
//   if (url.startsWith('http')) return url;
//   // remove leading slash from url, then prepend API_URL
//   const clean = url.replace(/^\//, '');
//   return '';
// };

// interface PostItemProps {
//   post: Post;
// }

// export function PostItem({ post }: PostItemProps) {
//   const { user } = useAuth();
//   const { likePost, commentPost, deletePost,sharePost,toggleSave } = usePost();
//   const [commentContent, setCommentContent] = useState('');
//   const [isCommenting, setIsCommenting] = useState(false);
//   const [showAllComments, setShowAllComments] = useState(false);
//   const [isModalOpen, setModalOpen] = useState(false);
//   const [saving, setSaving] = useState(false);


//   const postAuthor = post.author;
//   // console.log(postAuthor,'postAuthorpostAuthor')
//   const isLikedByCurrentUser = user ? post?.likes?.some(l => l.userId === user.id) : false;

//   const handleLike = () => {
//     console.log(user,'useruser')
//     if (!user) return;
//     likePost(post.id);
//   };

//   const handleComment = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user || !commentContent.trim()) return;
//     commentPost(post.id, commentContent);
//     setCommentContent('');
//   };

//   const handleDeletePost = () => {
//     if (!user) return;
//     deletePost(post.id);
//   };

//   const handleToggleSave = async () => {
//     setSaving(true);
//     try {
//       await toggleSave(post.id, post.hasSaved);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setSaving(false);
//     }
//   };


//   const getInitials = (name: string) =>
//     name
//       .split(' ')
//       .map(n => n[0])
//       .join('')
//       .toUpperCase();

//   const renderedComments = showAllComments ? post?.comments : post.comments?.slice(0, 2);

//   return (
//     <Card className="mb-4">
//       <CardHeader className="p-4 pb-0 flex items-start">
//         <div className="flex-1 flex items-center space-x-3">
//           <Link to={`/profile/${postAuthor.id}`}>  
//             <Avatar>
//               {postAuthor.profileImage ? (
//                 <AvatarImage src={resolveMediaUrl(postAuthor.profileImage)} alt={postAuthor.username} />
//               ) : (
//                 <AvatarFallback>{getInitials(postAuthor.username)}</AvatarFallback>
//               )}
//             </Avatar>
//           </Link>
//           <div>
//             <Link to={`/profile/${postAuthor.id}`} className="font-semibold hover:underline">
//               {postAuthor.username}
//             </Link>
//             <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
//           </div>
//         </div>
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
//                 <MoreHorizontal className="h-5 w-5" />
//               </Button>
//             </DropdownMenuTrigger>

//         {user && user.id === postAuthor.id && (
//             <DropdownMenuContent align="end">
//               <DropdownMenuItem onClick={handleDeletePost} className="text-red-600">
//                 Delete post
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//         )}
//          <DropdownMenuContent align="end">
//             <DropdownMenuItem
//               onClick={handleToggleSave}
//               className="flex items-center space-x-2"
//             >
//               { post.hasSaved
//                 ? <BookmarkMinus className="w-4 h-4 text-gray-600" />
//                 : <Bookmark className="w-4 h-4 text-gray-600" />
//               }
//               <span>{post.hasSaved ? 'Unsave Post' : 'Save Post'}</span>
//             </DropdownMenuItem>
//             </DropdownMenuContent>
//             </DropdownMenu>
//       </CardHeader>

//       <CardContent className="p-4">
//         {post.content && <p className="mb-3 whitespace-pre-line">{post.content}</p>}

//         {/* Images */}
//         {post.images.length > 0 && (
//           <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mb-3`}>
//             {post.images.map((img, i) => (
//               <img
//                 key={i}
//                 src={(API_BASE_URL+'/uploads/'+stripUploads(img))}
//                 alt="Post"
//                 className="rounded-md w-full object-cover"
//                 style={{ maxHeight: post.images.length === 1 ? '500px' : '250px' }}
//               />
//             ))}
//           </div>
//         )}

//         {/* Videos */}
//         {post.videos.length > 0 && (
//           <div className="mb-3">
//             {post.videos.map((vid, i) => (
//               <video
//                 key={i}
//                 src={(API_BASE_URL+'/uploads/'+stripUploads(vid))}
//                 controls  
//                 className="rounded-md w-full"
//                 style={{ maxHeight: '500px' }}
//               />
//             ))}
//           </div>
//         )}

//         <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
//           {post.likes.length > 0 && (
//             <div className="flex items-center">
//               <div className="flex items-center justify-center bg-[#1877F2] text-white rounded-full p-1 h-5 w-5 mr-1">
//                 <ThumbsUp className="h-3 w-3" />
//               </div>
//               {post.likes.length}
//             </div>
//           )}
//           {post.comments.length > 0 && <div>{post.comments.length} comments</div>}
//           <div className="text-sm text-gray-500 mt-2">
//   {post.shareCount} Shares
// </div>
//         </div>
//       </CardContent>

//       <Separator />

//       {/* Actions */}
//       <CardFooter className="p-0">
//         <div className="grid grid-cols-3 w-full">
//           <Button
//             variant="ghost"
//             onClick={handleLike}
//             className={`flex items-center justify-center py-2 rounded-none ${
//               isLikedByCurrentUser ? 'text-[#1877F2]' : 'text-gray-600'
//             }`}
//           >
//             <ThumbsUp className={`h-5 w-5 mr-1 ${isLikedByCurrentUser ? 'fill-[#1877F2] text-[#1877F2]' : ''}`} />
//             Like
//           </Button>
//           <Button
//             variant="ghost"
//             onClick={() => setIsCommenting(!isCommenting)}
//             className="flex items-center justify-center py-2 rounded-none text-gray-600"
//           >
//             <MessageSquare className="h-5 w-5 mr-1" /> Comment
//           </Button>
//           <Button variant="ghost" className="flex items-center justify-center py-2 rounded-none text-gray-600" onClick={() => setModalOpen(true)}>
//             <Share2 className="h-5 w-5 mr-1" /> Share
//           </Button>
//         </div>
//       </CardFooter>

//       <ShareModal
//         isOpen={isModalOpen}
//         onClose={() => setModalOpen(false)}
//         onShare={(comment) => sharePost(post.id, comment)}
//       />

//       {/* Comments */}
//       {(post.comments.length > 0 || isCommenting) && (
//         <div className="p-4 pt-0">
//           <Separator className="my-4" />
//           {/* Comment list */}
//           {post.comments.length > 0 && (
//             <div className="space-y-3 mb-4">
//               {renderedComments.map(c => (
//                 <div key={c.id} className="flex space-x-2">
//                   <Avatar className="h-8 w-8">
//                     {c.profileImage ? (
//                       <AvatarImage src={resolveMediaUrl(c.profileImage)} alt={c.username} />
//                     ) : (
//                       <AvatarFallback>{getInitials(c.username)}</AvatarFallback>
//                     )}
//                   </Avatar>
//                   <div className="flex-1">
//                     <div className="bg-gray-100 rounded-lg p-2 px-3">
//                       <Link to={`/profile/${c.userId}`} className="font-semibold hover:underline">
//                         {c.username}
//                       </Link>
//                       <p className="text-sm">{c.content}</p>
//                     </div>
//                     <div className="flex space-x-3 text-xs text-gray-500 mt-1 ml-2">
//                       <span>{formatDate(c.createdAt)}</span>
//                       <button className="hover:text-[#1877F2]">Like</button>
//                       <button className="hover:text-[#1877F2]">Reply</button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               {post.comments.length > 2 && (
//                 <Button
//                   variant="ghost"
//                   onClick={() => setShowAllComments(!showAllComments)}
//                   className="text-gray-600 pl-0 pb-0"
//                 >
//                   {showAllComments ? 'Show fewer comments' : `View all ${post.comments.length} comments`}
//                 </Button>
//               )}
//             </div>
//           )}
//           {/* Comment form */}
//           {(isCommenting || post.comments.length > 0) && user && (
//             <form onSubmit={handleComment} className="flex space-x-2">
//               <Avatar className="h-8 w-8">
//                 {user.profileImage ? (
//                   <AvatarImage src={resolveMediaUrl(user.profileImage)} alt={user.username} />
//                 ) : (
//                   <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
//                 )}
//               </Avatar>
//               <div className="flex-1 flex">
//                 <Textarea
//                   placeholder="Write a comment..."
//                   value={commentContent}
//                   onChange={e => setCommentContent(e.target.value)}
//                   className="flex-1 resize-none min-h-[40px] max-h-[120px] focus-visible:ring-[#1877F2] rounded-full py-2"
//                 />
//                 <Button type="submit" size="icon" disabled={!commentContent.trim()} className="ml-2">
//                   <Send className="h-4 w-4" />
//                 </Button>
//               </div>
//             </form>
//           )}
//         </div>
//       )}
//     </Card>
//   );
// }

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePost } from '@/contexts/PostContext';
import { Link } from 'react-router-dom';
import { Post, Comment as CommentType } from '@/types';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShareModal } from '@/components/ui/ShareModal';
import { stripUploads } from '@/lib/url';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Send, Bookmark, BookmarkMinus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthHeader } from '@/hooks/useAuthHeader';

const API_BASE_RAW = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
const API_BASE = API_BASE_RAW.replace(/\/+$/, ''); // normalize (no trailing slash)

// ---- Shared, module-scoped batching for view events ----
const seenViewIds = new Set<string>();      // prevent duplicate sends this session
let pendingViewIds = new Set<string>();     // queue for batch send
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
  } catch {
    // best-effort; don't break UI
  }
}

function queueView(postId: string, authHeaders: Record<string, string>) {
  if (seenViewIds.has(postId)) return;
  seenViewIds.add(postId);
  pendingViewIds.add(postId);
  if (!flushHandle) {
    flushHandle = window.setTimeout(() => flushBatch(authHeaders), 1200);
  }
}

// -----------------------------------------------

const API_URL = import.meta.env.BACKEND_API_URL || '';
const resolveMediaUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  const clean = url.replace(/^\//, '');
  return '';
};

interface PostItemProps {
  post: Post;
  /** when false, disables view tracking (used by PostDetailModal) */
  trackViews?: boolean;
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

  const postAuthor = post.author;
  // console.log(postAuthor,'postAuthorpostAuthor')
  // const isLikedByCurrentUser = user ? post?.likes?.some(l => l.userId === user.id) : false;
  const isLikedByCurrentUser =
  !!user && (
    post?.hasLiked === true ||
    post?.likes?.some(l => String(l.userId) === String(user.id))
  );




  // ---- VIEW TRACKING (IntersectionObserver + 1s dwell) ----
  const viewRef = useRef<HTMLDivElement | null>(null);

  function getScrollParent(node: HTMLElement | null): Element | null {
    let el = node?.parentElement || null;
    while (el && el !== document.body) {
      const oy = getComputedStyle(el).overflowY;
      if (/(auto|scroll|overlay)/i.test(oy)) return el;
      el = el.parentElement;
    }
    return null; // falls back to viewport
  }

  function isVisible(entry: IntersectionObserverEntry, minRatio = 0.75) {
    const supported = typeof (entry as any).isIntersecting === 'boolean'
      ? (entry as any).isIntersecting
      : entry.intersectionRatio > 0; // Safari fallback
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
              // stop observing after first successful send to avoid refiring
              io.unobserve(el);
            }, 1000); // 1s dwell
          } else {
            if (dwellTimer) {
              clearTimeout(dwellTimer);
              dwellTimer = null;
            }
          }
        }
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    io.observe(el);
    return () => {
      if (dwellTimer) clearTimeout(dwellTimer);
      io.disconnect();
    };
  }, [post.id, authHeaders, trackViews]);

  const handleLike = () => {
    if (!user) return;
    likePost(post.id);
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

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

  const renderedComments = showAllComments ? post?.comments : post.comments?.slice(0, 2);

  return (
    <div ref={viewRef}>
      <Card className="mb-4">
        <CardHeader className="p-4 pb-0 flex items-start">
          <div className="flex-1 flex items-center space-x-3">
            <Link to={`/profile/${postAuthor.id}`}>
              <Avatar>
                {postAuthor.profileImage ? (
                  <AvatarImage src={API_BASE_RAW+'/uploads/'+stripUploads(postAuthor.profileImage)} alt={postAuthor.username} />
                ) : (
                  <AvatarImage src={API_BASE_RAW+'/uploads//profile/defaultavatar.png'} alt={postAuthor.username} />
             
                )} 
              </Avatar>
            </Link>
            <div>
              <Link to={`/profile/${postAuthor.id}`} className="font-semibold hover:underline">
                {postAuthor.username}
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

            {user && user.id === postAuthor.id && (
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDeletePost} className="text-red-600">
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleToggleSave}
                className="flex items-center space-x-2"
              >
                { post.hasSaved
                  ? <BookmarkMinus className="w-4 h-4 text-gray-600" />
                  : <Bookmark className="w-4 h-4 text-gray-600" />
                }
                <span>{post.hasSaved ? 'Unsave Post' : 'Save Post'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="p-4">
          {post.content && <p className="mb-3 whitespace-pre-line">{post.content}</p>}

          {/* Images */}
          {post.images.length > 0 && (
            <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mb-3`}>
              {post.images.map((img, i) => (
                <img
                  key={i}
                  src={(API_BASE + '/uploads/' + stripUploads(img))}
                  alt="Post"
                  className="rounded-md w-full object-cover"
                  style={{ maxHeight: post.images.length === 1 ? '500px' : '250px' }}
                />
              ))}
            </div>
          )}

          {/* Videos */}
          {post.videos.length > 0 && (
            <div className="mb-3">
              {post.videos.map((vid, i) => (
                <video
                  key={i}
                  src={(API_BASE + '/uploads/' + stripUploads(vid))}
                  controls
                  className="rounded-md w-full"
                  style={{ maxHeight: '500px' }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
            {post.likes.length > 0 && (
              <div className="flex items-center">
                <div className="flex items-center justify-center bg-[#1877F2] text-white rounded-full p-1 h-5 w-5 mr-1">
                  <ThumbsUp className="h-3 w-3" />
                </div>
                {post.likes.length}
              </div>
            )}
            {post.comments.length > 0 && <div>{post.comments.length} comments</div>}
            <div className="text-sm text-gray-500 mt-2">
              {post.shareCount} Shares
            </div>
          </div>
        </CardContent>

        <Separator />

        {/* Actions */}
        <CardFooter className="p-0">
          <div className="grid grid-cols-3 w-full">
            <Button
             variant="ghost"
             onClick={handleLike}
             aria-pressed={isLikedByCurrentUser}
             className={`flex items-center justify-center py-2 rounded-none transition-colors ${
               isLikedByCurrentUser ? 'text-[#1877F2]' : 'text-gray-600'
             }`}
             title={isLikedByCurrentUser ? 'Unlike' : 'Like'}
           >
              <ThumbsUp className={`h-5 w-5 mr-1 ${isLikedByCurrentUser ? 'fill-[#1877F2] text-[#1877F2]' : ''}`} />
              Like
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsCommenting(!isCommenting)}
              className="flex items-center justify-center py-2 rounded-none text-gray-600"
            >
              <MessageSquare className="h-5 w-5 mr-1" /> Comment
            </Button>
            <Button variant="ghost" className="flex items-center justify-center py-2 rounded-none text-gray-600" onClick={() => setModalOpen(true)}>
              <Share2 className="h-5 w-5 mr-1" /> Share
            </Button>
          </div>
        </CardFooter>

        <ShareModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onShare={(comment) => sharePost(post.id, comment)}
        />

        {/* Comments */}
        {(post.comments.length > 0 || isCommenting) && (
          <div className="p-4 pt-0">
            <Separator className="my-4" />
            {/* Comment list */}
            {post.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {(showAllComments ? post.comments : post.comments.slice(0, 2)).map(c => (
                  <div key={c.id} className="flex space-x-2">
                    <Avatar className="h-8 w-8">
                      {c.profileImage ? (
                        <AvatarImage src={resolveMediaUrl(c.profileImage)} alt={c.username} />
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
            {/* Comment form */}
            {(isCommenting || post.comments.length > 0) && user && (
              <form onSubmit={handleComment} className="flex space-x-2">
                <Avatar className="h-8 w-8">
                  {user.profileImage ? (
                    <AvatarImage src={resolveMediaUrl(user.profileImage)} alt={user.username} />
                  ) : (
                    <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                  )}
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

