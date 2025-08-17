// src/pages/PostPermalinkPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import { PostItem } from '@/components/post/PostItem';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPostDetail } from '@/services/postService';
import type { Post } from '@/types';
import { Loader2 } from 'lucide-react';

export default function PostPermalinkPage() {
  const { postId } = useParams<{ postId: string }>();
  const location = useLocation();
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    fetchPostDetail(postId, headers)
      .then(setPost)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [postId, accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
      </div>
    );
  }
  if (!post) return <div className="p-8 text-center">Post not found.</div>;

  return (
    <div className="flex flex-col h-screen bg-cus">
      <Navbar />

      {/* three-column layout */}
      <div className="flex flex-1 overflow-hidden px-4 lg:px-8">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto space-x-6">

          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto py-6">
            <div className="sticky top-16">   {/* pins under 64px navbar */}
              <Sidebar />
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto py-6">
            <div className="max-w-4xl mx-auto">
              <PostItem post={post} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
