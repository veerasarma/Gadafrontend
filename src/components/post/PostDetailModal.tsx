// src/components/post/PostDetailModal.tsx
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog'; // shadcn/ui
import { fetchPostDetail } from '@/services/postService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { PostItem } from '@/components/post/PostItem';
import type { Post } from '@/types';

export function PostDetailModal({ postId, open, onOpenChange }: { postId: string; open: boolean; onOpenChange: (o:boolean)=>void; }) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchPostDetail(postId, headers).then(setPost).catch(console.error);
  }, [open, postId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        {post ? <PostItem post={post} /> : <div className="p-8">Loading…</div>}
      </DialogContent>
    </Dialog>
  );
}
