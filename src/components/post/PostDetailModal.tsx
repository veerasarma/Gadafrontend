// src/components/post/PostDetailModal.tsx
// import * as React from 'react';
// import { useEffect, useState } from 'react';
// import { Dialog, DialogContent } from '@/components/ui/dialog'; // shadcn/ui
// import { fetchPostDetail } from '@/services/postService';
// import { useAuth } from '@/contexts/AuthContext';
// import { useAuthHeader } from '@/hooks/useAuthHeader';
// import { PostItem } from '@/components/post/PostItem';
// import type { Post } from '@/types';

// export function PostDetailModal({ postId, open, onOpenChange }: { postId: string; open: boolean; onOpenChange: (o:boolean)=>void; }) {
//   const { accessToken } = useAuth();
//   const headers = useAuthHeader(accessToken);
//   const [post, setPost] = useState<Post | null>(null);

//   useEffect(() => {
//     if (!open) return;
//     fetchPostDetail(postId, headers).then(setPost).catch(console.error);
//   }, [open, postId]);

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-3xl p-0 overflow-hidden">
//         {post ? <PostItem post={post} /> : <div className="p-8">Loading…</div>}
//       </DialogContent>
//     </Dialog>
//   );
// }


// src/components/post/PostDetailModal.tsx
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { fetchPostDetail } from '@/services/postService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { PostItem } from '@/components/post/PostItem';
import type { Post } from '@/types';

// --- local light-weight type (matches what your PostItem expects) ---
export type LiveSummary = {
  live: boolean;
  ended?: boolean;
  viewers?: number;
  liveId?: number;
  postId?: number;
};

const API_BASE_RAW = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
const API_BASE = API_BASE_RAW.replace(/\/+$/, '');

// Minimal fetcher to get live info for the post
async function fetchLiveSummary(postId: string, headers: Record<string, string>): Promise<LiveSummary | null> {
  try {
    const r = await fetch(`${API_BASE}/api/live/summary?postId=${encodeURIComponent(postId)}`, {
      headers,
      credentials: 'include',
    });
    if (!r.ok) return null;
    const j = await r.json();
    // Expect shape like { ok:true, live:{ live:true, ended:false, viewers:12, liveId, postId } }
    if (j?.live && typeof j.live === 'object') return j.live as LiveSummary;
    return null;
  } catch {
    return null;
  }
}

export function PostDetailModal({
  postId,
  open,
  onOpenChange,
  initialLive = null,           // ⬅️ NEW
}: {
  postId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialLive?: LiveSummary | null;
}) {
  console.log(initialLive,'initialLiveinitialLive')
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [post, setPost] = useState<Post | null>(null);
  const [live, setLive] = useState<LiveSummary | null>(initialLive ?? null);

  // keep the initial live that PostItem passes (instant paint)
  useEffect(() => {
    if (open) setLive(initialLive ?? null);
  }, [open, initialLive]);

  // fetch post details & refresh live summary whenever opened
  useEffect(() => {
    if (!open) return;
    let alive = true;
    // console.log(live,'livelivelive')
    // load post body
    fetchPostDetail(postId, headers).then((p) => {
      if(!initialLive)
      {
        setLive({channelName: p.live?.channelName,live: p.live?.live,viewers:0})
      }
      if (alive) setPost(p as any);
    }).catch(console.error);

    // load fresh live summary (so viewer count/status are current)
    // fetchLiveSummary(postId, headers).then((ls) => {
    //   if (alive) setLive(ls);
    // }).catch(() => { /* ignore */ });

    return () => { alive = false; };
  }, [open, postId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        {post
          ? <PostItem post={post} live={live as any} trackViews={false} />
          : <div className="p-8">Loading…</div>}
      </DialogContent>
    </Dialog>
  );
}

