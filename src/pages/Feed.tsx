// Feed.tsx (drop-in)
// import { useEffect, useMemo, useRef,useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Loader2, Rocket } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { usePost } from "@/contexts/PostContext";
// import { initializeStorage } from "@/lib/mock-data";
// import { CreatePost } from "@/components/post/CreatePost";
// import { PostItem } from "@/components/post/PostItem";
// import { Navbar } from "@/components/layout/Navbar";
// import Sidebar from "@/components/ui/Sidebar1";
// import RightSidebar from "@/components/ui/RightSidebar";
// import Stories from "@/components/ui/Stories";
// import { useAuthHeader } from '@/hooks/useAuthHeader';
// import { Button } from "@/components/ui/button";
// import SponsoredAdCard from "@/components/ads/SponsoredAdCard";
// import AdUnit from "@/components/ads/AdUnit";

// const API_BASE_RAW = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
// const API_BASE = API_BASE_RAW.replace(/\/+$/, '');


// /** Normalize backend -> { promotedPost, list } */
// function normalizePosts(raw: any): { promotedPost: any | null; list: any[] } {
//   if (Array.isArray(raw)) return { promotedPost: null, list: raw };
//   if (raw && typeof raw === "object") {
//     return { promotedPost: raw.promoted ?? null, list: Array.isArray(raw.items) ? raw.items : [] };
//   }
//   return { promotedPost: null, list: [] };
// }

// /** Extract numeric post id from row */
// function getPostId(p: any): number | null {
//   const id = p?.post_id ?? p?.id;
//   const n = Number(id);
//   return Number.isFinite(n) && n > 0 ? n : null;
// }

// export default function FeedPage() {
//   const { user, accessToken, isLoading: authLoading } = useAuth();
//   const authHeaders = useAuthHeader(accessToken);
//   const { posts, loading: postsLoading, busy, loadMore } = usePost();
//   const infiniteRef = useRef<HTMLDivElement | null>(null);

//   const navigate = useNavigate();

//   useEffect(() => initializeStorage(), []);
//   useEffect(() => {
//     if (!authLoading && !accessToken) navigate("/login");
//   }, [authLoading, accessToken, navigate]);

//   // normalize posts shape
//   const { promotedPost, list } = useMemo(() => normalizePosts(posts), [posts]);

//   // visible post ids (for live-status batch call)
//   const visibleIds = useMemo(() => {
//     const ids: number[] = [];
//     const pid = promotedPost ? getPostId(promotedPost) : null;
//     if (pid) ids.push(pid);
//     for (const p of list) {
//       const id = getPostId(p);
//       if (id) ids.push(id);
//     }
//     return Array.from(new Set(ids));
//   }, [promotedPost, list]);

//   // live status map: postId -> { isLive, channelId?, viewers? }
//   const [liveMap, setLiveMap] = useState<Record<
//     number,
//     { isLive: boolean; channelId?: string; viewers?: number }
//   >>({});

//   const lastIdsStrRef = useRef<string>("");

//   useEffect(() => {
//     console.log(infiniteRef.current,'infiniteRef.current')
//     if (!infiniteRef.current) return;
//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting && !busy) {
//           loadMore();
//         }
//       },
//       { threshold: 1.0 }
//     );
//     observer.observe(infiniteRef.current);
//     return () => observer.disconnect();
//   }, [busy, loadMore]);
  

//   // single batched poll for live status
//   useEffect(() => {
//     const idsStr = visibleIds.join(",");
//     if (!idsStr || idsStr === lastIdsStrRef.current) return;
//     lastIdsStrRef.current = idsStr;

//     let cancelled = false;
//     let timer: number | undefined;

//     const fetchOnce = async () => {
//       try {
//         const url = `${API_BASE}/api/live/for-posts?ids=${encodeURIComponent(idsStr)}`;
//         const res = await fetch(url, { headers: authHeaders });
//         if (!res.ok) return;
//         const body = await res.json();
//         if (!cancelled && body && typeof body === "object") {
//           setLiveMap(body.data);
//         }
//       } catch {}
//     };

//     void fetchOnce();
//     timer = window.setInterval(fetchOnce, 12000);
//     return () => { cancelled = true; if (timer) window.clearInterval(timer); };
//   }, [authHeaders, visibleIds]);
//   // attach live info to each post (kept in a 'live' field on the post object)
//   const promotedWithLive = useMemo(() => {
//     if (!promotedPost) return null;
//     const pid = getPostId(promotedPost);
//     return pid ? { ...promotedPost, live: liveMap[pid] || null } : promotedPost;
//   }, [promotedPost, liveMap]);

//   const listWithLive = useMemo(() => {
//     console.log('postsLoadingpostsLoadingpostsLoading')
//     if (!list?.length) return [];
//     return list.map((p) => {
//       const pid = getPostId(p);
//       return pid ? { ...p, live: liveMap[pid] || null } : p;
//     });
//   }, [list, liveMap]);
//   if (authLoading || postsLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-screen bg-cus">
//       <Navbar />

//       <div className="flex flex-1 overflow-hidden px-4 lg:px-8">
//         <div className="flex flex-1 max-w-[1600px] w-full mx-auto space-x-6">
//           {/* LEFT SIDEBAR */}
//           <aside className="hidden lg:block lg:w-1/5 show-sidebar-landscape min-h-0 overflow-y-auto py-6">
//             <div className="sticky top-16">
//               <Sidebar />
//             </div>
//           </aside>

//           <AdUnit />

//           {/* CENTER FEED */}
//           <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
//             <div className="space-y-6 py-6">
//               <div className="bg-white rounded-lg shadow p-4">
//                 <CreatePost />
//               </div>

//               <div className="bg-white rounded-lg shadow p-4">
//                 <h2 className="text-lg font-semibold mb-4">Stories</h2>
//                 <Stories />
//               </div>

//               {/* Sponsored ad in the feed */}
//               <div className="mx-auto max-w-[680px] w-full">
//                 <SponsoredAdCard placement="newsfeed" />
//               </div>

//               <div className="mx-auto max-w-[680px] w-full flex flex-col gap-4">
//                 {/* promoted (if present) */}
//                 {promotedWithLive && (
//                   <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
//                     {/* ✅ pass live explicitly */}
//                     <PostItem
//                       post={promotedWithLive as any}
//                       live={(promotedWithLive as any).live}
//                     />
//                   </div>
//                 )}

//                 {/* feed list */}
//                 {listWithLive.map((post) => (
//                   <div
//                     key={String((post as any).post_id ?? (post as any).id)}
//                     className="rounded-2xl overflow-hidden border border-slate-200 bg-white"
//                   >
//                     {/* ✅ pass live explicitly */}
//                     <PostItem
//                       post={post as any}
//                       live={(post as any).live}
//                     />
//                   </div>
//                 ))}
//                 <div ref={infiniteRef} className="h-10" />

//                 {/* load more */}
//                 <div className="flex items-center justify-center py-6">
//                   <Button
//                     variant="outline"
//                     disabled={busy}
//                     onClick={() => loadMore?.()}
//                     className="min-w-[180px]"
//                   >
//                     {busy ? (
//                       <>
//                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         Loading…
//                       </>
//                     ) : (
//                       "Load more"
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </main>

//           {/* RIGHT WIDGETS */}
//           <aside className="hidden xl:block xl:w-96 min-h-0 overflow-y-auto pt-6">
//             <RightSidebar />
//           </aside>
//         </div>
//       </div>
//     </div>
//   );
// }

// Feed.tsx — mobile full-width posts, desktop unchanged
import { useEffect, useMemo, useRef,useState } from "react";
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
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { Button } from "@/components/ui/button";
import SponsoredAdCard from "@/components/ads/SponsoredAdCard";
import AdUnit from "@/components/ads/AdUnit";

const API_BASE_RAW = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
const API_BASE = API_BASE_RAW.replace(/\/+$/, '');

/** Normalize backend -> { promotedPost, list } */
function normalizePosts(raw: any): { promotedPost: any | null; list: any[] } {
  if (Array.isArray(raw)) return { promotedPost: null, list: raw };
  if (raw && typeof raw === "object") {
    return { promotedPost: raw.promoted ?? null, list: Array.isArray(raw.items) ? raw.items : [] };
  }
  return { promotedPost: null, list: [] };
}

/** Extract numeric post id from row */
function getPostId(p: any): number | null {
  const id = p?.post_id ?? p?.id;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function FeedPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const authHeaders = useAuthHeader(accessToken);
  const { posts, loading: postsLoading, busy, loadMore } = usePost();
  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => initializeStorage(), []);
  useEffect(() => {
    if (!authLoading && !accessToken) navigate("/login");
  }, [authLoading, accessToken, navigate]);

  // normalize posts shape
  const { promotedPost, list } = useMemo(() => normalizePosts(posts), [posts]);

  // visible post ids (for live-status batch call)
  const visibleIds = useMemo(() => {
    const ids: number[] = [];
    const pid = promotedPost ? getPostId(promotedPost) : null;
    if (pid) ids.push(pid);
    for (const p of list) {
      const id = getPostId(p);
      if (id) ids.push(id);
    }
    return Array.from(new Set(ids));
  }, [promotedPost, list]);

  // live status map: postId -> { isLive, channelId?, viewers? }
  const [liveMap, setLiveMap] = useState<Record<
    number,
    { isLive: boolean; channelId?: string; viewers?: number }
  >>({});

  const lastIdsStrRef = useRef<string>("");

  // infinite scroll sentinel
  useEffect(() => {
    if (!infiniteRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !busy) loadMore?.();
      },
      { threshold: 1.0 }
    );
    observer.observe(infiniteRef.current);
    return () => observer.disconnect();
  }, [busy, loadMore]);

  // single batched poll for live status
  useEffect(() => {
    const idsStr = visibleIds.join(",");
    if (!idsStr || idsStr === lastIdsStrRef.current) return;
    lastIdsStrRef.current = idsStr;

    let cancelled = false;
    let timer: number | undefined;

    const fetchOnce = async () => {
      try {
        const url = `${API_BASE}/api/live/for-posts?ids=${encodeURIComponent(idsStr)}`;
        const res = await fetch(url, { headers: authHeaders });
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body && typeof body === "object") {
          setLiveMap(body.data);
        }
      } catch {}
    };

    void fetchOnce();
    timer = window.setInterval(fetchOnce, 12000);
    return () => { cancelled = true; if (timer) window.clearInterval(timer); };
  }, [authHeaders, visibleIds]);

  // attach live info to each post (kept in a 'live' field on the post object)
  const promotedWithLive = useMemo(() => {
    if (!promotedPost) return null;
    const pid = getPostId(promotedPost);
    return pid ? { ...promotedPost, live: liveMap[pid] || null } : promotedPost;
  }, [promotedPost, liveMap]);

  const listWithLive = useMemo(() => {
    if (!list?.length) return [];
    return list.map((p) => {
      const pid = getPostId(p);
      return pid ? { ...p, live: liveMap[pid] || null } : p;
    });
  }, [list, liveMap]);

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

      {/* NOTE: px-0 on mobile to allow full-bleed cards */}
      <div className="flex flex-1 overflow-hidden px-0 md:px-4 lg:px-8">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto space-x-0 md:space-x-6">
          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:w-1/5 show-sidebar-landscape min-h-0 overflow-y-auto py-6">
            <div className="sticky top-16">
              <Sidebar />
            </div>
          </aside>

          <AdUnit />

          {/* CENTER FEED */}
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="space-y-6 py-6">
              {/* Full-width on mobile, rounded on md+ */}
              <div className="bg-white rounded-none md:rounded-lg shadow p-4">
                <CreatePost />
              </div>

              <div className="bg-white rounded-none md:rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Stories</h2>
                <Stories />
              </div>

              {/* Sponsored ad in the feed */}
              <div className="w-full md:max-w-[680px] md:mx-auto">
                <SponsoredAdCard placement="newsfeed" />
              </div>

              {/* POSTS — full-bleed on mobile, centered 680px on md+ */}
              <div className="w-full md:max-w-[680px] md:mx-auto flex flex-col gap-4">
                {/* promoted (if present) */}
                {promotedWithLive && (
                  <div className="rounded-none md:rounded-2xl overflow-hidden border border-slate-200 bg-white">
                    <PostItem post={promotedWithLive as any} live={(promotedWithLive as any).live} />
                  </div>
                )}

                {/* feed list */}
                {listWithLive.map((post) => (
                  <div
                    key={String((post as any).post_id ?? (post as any).id)}
                    className="rounded-none md:rounded-2xl overflow-hidden border border-slate-200 bg-white"
                  >
                    <PostItem post={post as any} live={(post as any).live} />
                  </div>
                ))}

                {/* infinite scroll sentinel */}
                <div ref={infiniteRef} className="h-10" />

                {/* manual load more (kept) */}
                <div className="flex items-center justify-center py-6">
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => loadMore?.()}
                    className="min-w-[180px]"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              </div>
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

