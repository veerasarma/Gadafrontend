import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchPosts,
  createPost as apiAddPost,
  toggleLike as apiLikePost,
  addComment as apiCommentPost,
  sharePost as apiSharePost,
  unsavePost,
  savePost,
  uploadMedia,
  deletePost as apiDeletePost,

} from '@/services/postService';
import { useAuthHeader,useAuthHeaderupload } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types';
import { toast } from 'sonner';


interface PostContextType {
  posts: Post[];
  busy: boolean;
  loading: boolean;
  loadMore: () => Promise<void>;
  addPost: (content: string, images: File[], videos: File[]) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  commentPost: (postId: string, content: string) => Promise<void>;
  sharePost: (postId: string, comment?: string) => Promise<void>;
  toggleSave: (postId: string, currentlySaved: boolean) => Promise<void>;
}

type FeedPayload = { items: Post[]; promoted?: any } | Post[];

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC = ({ children }) => {
  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headers1 = useAuthHeaderupload(accessToken);

  const [posts, setPosts] = useState<Post[]>([]);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const limit = 20;



  
  // initial load
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetchPosts(headers, 0, limit)
      .then((data) => {
        setPosts(data);
        setOffset(data.items.length);
      })
      .finally(() => setLoading(false));
  }, [accessToken, user]);

  const append = (prev: FeedPayload, add: FeedPayload): FeedPayload => {
    if (Array.isArray(prev)) {
      const addItems = Array.isArray(add) ? add : (add?.items ?? []);
      return [...prev, ...addItems];
    }
    // prev is object
    const addItems = Array.isArray(add) ? add : (add?.items ?? []);
    return { ...prev, items: [...(prev.items ?? []), ...addItems] };
  };


  const loadMore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await fetchPosts(headers, offset, limit);
      // console.log(data,'loadmore data')
      if (data?.items.length > 0) {
        setPosts(prev => append(prev, data));
        setOffset((o) => o + data?.items.length);
      }
    } finally {
      setBusy(false);
    }
  };

  async function addPost(content: string, imageFiles: File[], videoFiles: File[]) {
    const media = await uploadMedia([...imageFiles, ...videoFiles],headers1);
    const newPost = await apiAddPost(user.id, content, media,headers);
    if(newPost)
    {
      toast.success("Post has been created successfully")
      fetchPosts(headers)
      .then(setPosts)
      .catch(console.error);
    }
  };

  const likePost = async (postId: string) => {
    await apiLikePost(postId, user.id, headers);
    fetchPosts(headers)
    .then(setPosts)
    .catch(console.error);
  };

  const commentPost = async (postId: string, content: string) => {
    const comment = await apiCommentPost(postId,user.id, content, headers);
    if(comment)
    {
      fetchPosts(headers)
        .then(setPosts)
        .catch(console.error);
    }
  };

  const sharePost = async (postId: string, comment?: string) => {
    await apiSharePost(postId, comment, headers);
    toast.success("Post has been shared successfully");
    // Refresh the feed so the newly-shared post appears on timeline
    try {
      const fresh = await fetchPosts(headers);
      setPosts(fresh);
    } catch (err) {
      console.error(err);
    }
  };

  function removePostFromState(state: any, idStr: string) {
    if (Array.isArray(state)) {
      // Simple array feed
      return state.filter((p: any) => String(p.id) !== idStr);
    }
    // Object feed: { items: Post[], promoted?: Post | null }
    const next: any = { ...state };
    if (Array.isArray(next.items)) {
      next.items = next.items.filter((p: any) => String(p.id) !== idStr);
    }
    if (next.promoted && String(next.promoted.id) === idStr) {
      next.promoted = null; // if the deleted post was the promoted one
    }
    return next;
  }
  
  function restoreState(prev: any) {
    // simple passthrough – kept for symmetry and future hooks
    return prev;
  }
  
  // --- replace your deletePost with this ---
  const deletePost = async (postId: string) => {
    const ok = window.confirm("Are you sure you want to delete this post?");
  if (!ok) return;


    const idStr = String(postId);
    const prevState: any = posts;                 // snapshot for rollback
  
    // optimistic UI (works for array or {items, promoted})
    setPosts((curr: any) => removePostFromState(curr, idStr));
  
    try {
      await apiDeletePost(idStr, headers);
      toast.success("Post deleted.");
    } catch (e: any) {
      // rollback on error
      setPosts(restoreState(prevState));
      toast.error(e?.message || "Failed to delete post");
    }
  };


  
  // const toggleSave = async (postId: string, currentlySaved: boolean) => {
  //   await apiToggleSave(postId, headers);
  //   setPosts(prev => prev.map(p => p.id === postId
  //     ? { ...p, hasSaved: !currentlySaved }
  //     : p
  //   ));
  // };

  const toggleSave = async (postId: string, currentlySaved: boolean) => {
    if (currentlySaved) {
      await unsavePost(postId, headers);
    } else {
      await savePost(postId, headers);
    }
    setPosts(ps =>
      ps.map(p =>
        p.id === postId
          ? { ...p, hasSaved: !currentlySaved }
          : p
      )
    );
  };  

  return (
    <PostContext.Provider
    value={{
      posts,
      busy,
      loading,
      loadMore,
      addPost,
      likePost,
      commentPost,
      sharePost,
      toggleSave,
      deletePost
    }}
  >
    {children}
  </PostContext.Provider>
  );
};

export const usePost = (): PostContextType => {
  const context = useContext(PostContext);
  if (!context) throw new Error('usePost must be used within PostProvider');
  return context;
};
