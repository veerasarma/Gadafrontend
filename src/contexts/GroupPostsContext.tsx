import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    fetchGroupPosts,
    createGroupPost,
    toggleLikeGroupPost,
    addGroupPostComment
  } from '@/services/groupsService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader,useAuthHeaderupload } from '@/hooks/useAuthHeader';


const PostsContext = createContext(null);

export function GroupPostsProvider({ groupId, children }) {
  const {accessToken} = useAuth();
  const headers = useAuthHeader(accessToken);
  const headers1 = useAuthHeaderupload(accessToken);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchGroupPosts(groupId, headers).then(setPosts).catch(console.error);
  }, [groupId, accessToken]);

  const addPost = async (content, files) => {
    const form = new FormData();
    form.append('content', content);
    files.forEach(f => form.append('media', f));
    await createGroupPost(groupId, form, headers1);
    setPosts(await fetchGroupPosts(groupId, headers));
  };

  const likePost = async (postId) => {
    await toggleLikeGroupPost(postId, headers);
    setPosts(await fetchGroupPosts(groupId, headers));
  };

  const commentPost = async (postId, content) => {
    await addGroupPostComment(postId, content, headers);
    setPosts(await fetchGroupPosts(groupId, headers));
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, likePost, commentPost }}>
      {children}
    </PostsContext.Provider>
  );
}
export function useGroupPosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('useGroupPosts inside provider');
  return ctx;
}
