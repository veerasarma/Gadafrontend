// src/pages/SavedPostsPage.tsx
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { fetchSavedPostsEnriched } from '@/services/postService';
import { PostItem } from '@/components/post/PostItem';
import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import type { Post } from '@/types';
import RightSidebar from '@/components/ui/RightSidebar';


export default function SavedPostsPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !accessToken) {
      navigate('/login');
    }
  }, [authLoading, accessToken, navigate]);

  // Fetch saved posts when token is ready
  useEffect(() => {
    if (!accessToken) return;
    fetchSavedPostsEnriched(headers)
      .then(setSavedPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />

      <div className="flex flex-1 overflow-hidden px-4 lg:px-8">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto space-x-6">

          {/* Sidebar */}
          <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto py-6">
          <Sidebar />
        </aside>
        {/* Main content */}

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Header card */}
            <div className="bg-white rounded-lg shadow p-4">
              <h1 className="text-3xl font-bold">Saved Posts</h1>
              <p className="text-gray-600 mt-1">
                All the posts you’ve saved for later
              </p>
            </div>

            {/* Saved posts feed */}
            {savedPosts.length > 0 ? (
              savedPosts.map(post => (
                <PostItem key={post.id} post={post} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-700">
                  No saved posts yet
                </h3>
                <p className="text-gray-500 mt-2">
                  When you save a post, it’ll show up here.
                </p>
              </div>
            )}

          </div>
        </main>

         {/* Right widgets (desktop) */}
         <aside className="hidden xl:block xl:w-96 min-h-0 overflow-y-auto pt-6">
         <RightSidebar/>
        </aside>
      </div>
    </div>
    </div>

    
  );
}
