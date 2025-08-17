import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchPosts,
  createPost as apiAddPost,
  toggleLike as apiLikePost,
  addComment as apiCommentPost,
  sharePost as apiSharePost,
  unsavePost,
  savePost,
  uploadMedia

} from '@/services/postService';
import { useAuthHeader,useAuthHeaderupload } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types';
import { toast } from 'sonner';

interface PostContextType {
  posts: Post[];
  addPost: (content: string, images: File[], videos: File[]) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  commentPost: (postId: string, content: string) => Promise<void>;
  sharePost: (postId: string, comment?: string) => Promise<void>;
  toggleSave: (postId: string, currentlySaved: boolean) => Promise<void>;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC = ({ children }) => {
  const { accessToken,user } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headers1 = useAuthHeaderupload(accessToken);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    // load posts
    fetchPosts(headers)
      .then(setPosts)
      .catch(console.error);
  }, [accessToken,user]);

  async function addPost(content: string, imageFiles: File[], videoFiles: File[]) {
    console.log(headers1,'headers1headers1headers1')
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
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, hasShared: true, shareCount: p.shareCount + 1 }
      : p
    ));
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
    <PostContext.Provider value={{ posts, addPost, likePost, commentPost, sharePost, toggleSave }}>
      {children}
    </PostContext.Provider>
  );
};

export const usePost = (): PostContextType => {
  const context = useContext(PostContext);
  if (!context) throw new Error('usePost must be used within PostProvider');
  return context;
};
