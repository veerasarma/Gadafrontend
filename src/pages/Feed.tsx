import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePost } from '@/contexts/PostContext';
import { initializeStorage } from '@/lib/mock-data';
import { CreatePost } from '@/components/post/CreatePost';
import { PostItem } from '@/components/post/PostItem';
import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import RightSidebar from '@/components/ui/RightSidebar';
import Stories from '@/components/ui/Stories';

export default function FeedPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const { posts, loading: postsLoading } = usePost();
  const navigate = useNavigate();

  useEffect(() => initializeStorage(), []);
  useEffect(() => {
    if (!authLoading && !accessToken) navigate('/login');
  }, [authLoading, accessToken, navigate]);

  if (authLoading || postsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
      </div>
    );
  }

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

          {/* CENTER FEED */}
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="space-y-6 py-6">
              <div className="bg-white rounded-lg shadow p-4">
                <CreatePost />
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Stories</h2>
                <Stories />
              </div>

              {posts.length > 0 ? (
                posts.map(post => (
                  <PostItem key={post.id} post={post} />
                ))
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <h3 className="text-xl font-semibold text-gray-700">No posts yet</h3>
                  <p className="text-gray-500 mt-2">
                    Create your first post or follow friends to see their posts here.
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT WIDGETS */}
          <aside className="hidden xl:block xl:w-96 min-h-0 overflow-y-auto pt-6">
           <RightSidebar/>
          </aside>

        </div>
      </div>
    </div>
  );
}