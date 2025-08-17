// src/pages/MemoriesPage.tsx
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { fetchMemoryPosts } from '@/services/memoryService';
import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import { PostItem } from '@/components/post/PostItem';
import type { Post } from '@/types';

export default function MemoriesPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !accessToken) navigate('/login');
  }, [authLoading, accessToken, navigate]);

  useEffect(() => {
    if (!accessToken) return;
    fetchMemoryPosts(headers)
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-cus">
      <Navbar />

      <div className="flex flex-1 overflow-hidden px-4 lg:px-8">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto space-x-6">
          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto py-6">
            <div className="sticky top-16">
              <Sidebar />
            </div>
          </aside>

          {/* CENTER */}
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="space-y-6 py-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h1 className="text-2xl font-bold">On This Day</h1>
                <p className="text-gray-600">Your posts from this date in previous years.</p>
              </div>

              {posts.length > 0 ? (
                posts.map(p => <PostItem key={p.id} post={p} />)
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <h3 className="text-xl font-semibold text-gray-700">No memories today</h3>
                  <p className="text-gray-500">Come back tomorrow!</p>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT (optional widgets) */}
          <aside className="hidden xl:block xl:w-80 py-6">
            <div className="sticky space-y-8">
              {/* add widgets if needed */}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
