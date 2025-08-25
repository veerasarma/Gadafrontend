import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Rocket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePost } from "@/contexts/PostContext";
import { initializeStorage } from "@/lib/mock-data";
import { CreatePost } from "@/components/post/CreatePost";
import { PostItem } from "@/components/post/PostItem";
import { Navbar } from "@/components/layout/Navbar";
import Sidebar from "@/components/ui/Sidebar1";
import RightSidebar from "@/components/ui/RightSidebar";
import Stories from "@/components/ui/Stories";

export default function FeedPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const { posts, loading: postsLoading } = usePost();
  const navigate = useNavigate();

  useEffect(() => initializeStorage(), []);
  useEffect(() => {
    if (!authLoading && !accessToken) navigate("/login");
  }, [authLoading, accessToken, navigate]);

  // --- helpers -------------------------------------------------
  function isBoosted(p: any) {
    return p?.boosted === true || p?.boosted === 1 || String(p?.boosted) === "1"
      || p?.page_boosted === true || p?.page_boosted === 1 || String(p?.page_boosted) === "1";
  }

  // pick one boosted post randomly per mount/when candidate set changes
  const pickRef = useRef<number | null>(null);
  const sigRef = useRef<string>("");

  const { promotedPost, restPosts } = useMemo(() => {
    // Handle both API shapes:
    //  - legacy: posts is an array (we'll pick promoted randomly from boosted)
    //  - new: posts is { promoted, items } (use promoted directly)
    const isObjectFeed =
      posts && !Array.isArray(posts) && typeof posts === "object";

    const itemsRaw: any[] = isObjectFeed
      ? (posts as any).items || []
      : (Array.isArray(posts) ? posts : []);

    const promotedFromApi = isObjectFeed ? (posts as any).promoted || null : null;

    // New shape present: use promoted from API, ensure it's not in items
    if (promotedFromApi) {
      const promotedId = String(promotedFromApi.id);
      const deduped = itemsRaw.filter((p) => String(p.id) !== promotedId);

      // Show latest first (explicit, as requested)
      const sorted = deduped.slice().sort((a, b) => {
        const ta = Date.parse(a.createdAt || a.time || 0);
        const tb = Date.parse(b.createdAt || b.time || 0);
        return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
      });

      return { promotedPost: promotedFromApi, restPosts: sorted };
    }

    // Legacy shape: randomly pick ONE boosted post from the list (on refresh)
    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      pickRef.current = null;
      sigRef.current = "";
      return { promotedPost: null as any, restPosts: itemsRaw ?? [] };
    }

    const boosted = itemsRaw.filter(isBoosted);
    if (boosted.length === 0) {
      pickRef.current = null;
      sigRef.current = "";

      // Latest first for the rest
      const sortedAll = itemsRaw.slice().sort((a, b) => {
        const ta = Date.parse(a.createdAt || a.time || 0);
        const tb = Date.parse(b.createdAt || b.time || 0);
        return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
      });

      return { promotedPost: null as any, restPosts: sortedAll };
    }

    // Signature of candidate set; if it changes, re-pick a new random
    const sig = boosted.map((p) => String(p.id)).sort().join(",");
    if (pickRef.current === null || sigRef.current !== sig) {
      pickRef.current = Math.floor(Math.random() * boosted.length);
      sigRef.current = sig;
    }

    const chosen = boosted[pickRef.current % boosted.length];
    const rest = itemsRaw.filter((p) => String(p.id) !== String(chosen.id));

    // Latest first for normal list
    const sortedRest = rest.slice().sort((a, b) => {
      const ta = Date.parse(a.createdAt || a.time || 0);
      const tb = Date.parse(b.createdAt || b.time || 0);
      return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
    });

    return { promotedPost: chosen, restPosts: sortedRest };
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

              {/* Promoted section: exactly one boosted post, not included below */}
              {promotedPost && (
                <>
                  <section className="mb-6">
                    <div className="rounded-xl p-3">
                      <div className="flex items-center gap-2 font-semibold mb-2">
                        <Rocket className="w-4 h-4" />
                        <span>Promoted posts for you</span>
                      </div>
                      <div className="[&_.post-card]:w-full [&_.post-card]:max-w-none">
                        <PostItem post={promotedPost as any} />
                      </div>
                    </div>
                  </section>

                  <div className="my-6 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs uppercase tracking-wide ">
                      More posts
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                </>
              )}

              {/* Normal posts: latest first */}
              {Array.isArray(restPosts) && restPosts.length > 0 ? (
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
