import { useEffect,useMemo,useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePost } from "@/contexts/PostContext";
import { initializeStorage } from "@/lib/mock-data";
import { CreatePost } from "@/components/post/CreatePost";
import { PostItem } from "@/components/post/PostItem";
import { Navbar } from "@/components/layout/Navbar";
import Sidebar from "@/components/ui/Sidebar1";
import RightSidebar from "@/components/ui/RightSidebar";
import Stories from "@/components/ui/Stories";
import { Rocket } from 'lucide-react';


export default function FeedPage() {
  const { user,accessToken, isLoading: authLoading } = useAuth();
  const { posts, loading: postsLoading } = usePost();
  const navigate = useNavigate();


  function isBoosted(p: any) {
    return String(p?.boosted) === '1' || p?.boosted === true ||
           String(p?.page_boosted) === '1' || p?.page_boosted === true;
  }


  useEffect(() => initializeStorage(), []);
  useEffect(() => {
    if (!authLoading && !accessToken) navigate("/login");
  }, [authLoading, accessToken, navigate]);

// choose exactly ONE boosted post “randomly” (but stable for this user today)
const pickRef = useRef<number | null>(null);
  const prevSigRef = useRef<string>('');

  const { promotedPost, restPosts } = useMemo(() => {
    if (!Array.isArray(posts) || posts.length === 0) {
      return { promotedPost: null as any, restPosts: posts ?? [] };
    }

    const boosted = posts.filter(isBoosted);
    if (boosted.length === 0) {
      pickRef.current = null;
      prevSigRef.current = '';
      return { promotedPost: null as any, restPosts: posts };
    }

    // signature of boosted set; if it changes, re-pick a new random
    const sig = boosted.map(p => String(p.id)).sort().join(',');
    if (pickRef.current === null || prevSigRef.current !== sig) {
      // true random each time this component mounts or boosted set changes
      pickRef.current = Math.floor(Math.random() * boosted.length);
      prevSigRef.current = sig;
    }

    const chosen = boosted[pickRef.current % boosted.length];
    const rest = posts.filter(p => String(p.id) !== String(chosen.id));
    return { promotedPost: chosen, restPosts: rest };
  }, [posts]);
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
            <div className="sticky top-16">
              {" "}
              {/* pins under 64px navbar */}
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

              {promotedPost && (
        <section className="mb-6">
          <div className="flex items-center gap-2 font-semibold mb-3">
            <Rocket className="w-4 h-4" />
            <span>Promoted posts for you</span>
          </div>
          {/* Render exactly like a regular post */}
          <PostItem post={promotedPost as any} />
        </section>
      )}

       {/* ====== Divider between sections ====== */}
       {promotedPost && (
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs uppercase tracking-wide">More posts</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      )}

              {restPosts.length > 0 ? (
                restPosts.map((post) => <PostItem key={post.id} post={post} />)
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <h3 className="text-xl font-semibold text-gray-700">
                    No posts yet
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Create your first post or follow friends to see their posts
                    here.
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT WIDGETS */}
          <aside className="hidden xl:block xl:w-96 min-h-0 overflow-y-auto pt-6">
            <RightSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
