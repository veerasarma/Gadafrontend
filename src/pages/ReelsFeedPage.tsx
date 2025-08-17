// import { useEffect, useRef, useState } from 'react';
// import { Navbar } from '@/components/layout/Navbar';
// import { useAuth } from '@/contexts/AuthContext';
// import { useAuthHeader } from '@/hooks/useAuthHeader';
// import { fetchReels } from '@/services/reelService';
// import ReelCard from '@/components/reels/ReelCard';
// import { toggleReelLike, shareReel } from '@/services/reelService';

// export default function ReelsFeedPage() {
//   const { accessToken } = useAuth();
//   const headers = useAuthHeader(accessToken);
//   const [reels, setReels] = useState<any[]>([]);
//   const [active, setActive] = useState(0);

//   useEffect(() => {
//     if (!accessToken) return;
//     fetchReels(headers).then(setReels).catch(console.error);
//   }, [accessToken]);

//   // keyboard navigation
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === 'ArrowDown') setActive(a => Math.min(a + 1, reels.length - 1));
//       if (e.key === 'ArrowUp') setActive(a => Math.max(a - 1, 0));
//     };
//     window.addEventListener('keydown', onKey);
//     return () => window.removeEventListener('keydown', onKey);
//   }, [reels.length]);

//   const like = async (id: number) => {
//     const { liked } = await toggleReelLike(id, headers);
//     setReels(prev => prev.map(r => r.id===id ? {
//       ...r,
//       hasLiked: liked,
//       likeCount: r.likeCount + (liked ? 1 : -1)
//     } : r));
//   };

//   const share = async (id: number) => {
//     await shareReel(id, headers);
//     setReels(prev => prev.map(r => r.id===id ? { ...r, shareCount: r.shareCount + 1 } : r));
//   };

//   return (
//     <div className="flex flex-col h-screen bg-black">
//       <Navbar />
//       <div className="flex-1 flex items-center justify-center overflow-hidden">
//         <div className="flex items-center justify-center w-full h-full">
//           {/* Reel rail */}
//           <div className="flex flex-col items-center gap-10 overflow-y-auto py-10 snap-y snap-mandatory">
//             {reels.map((r, idx) => (
//               <div key={r.id} className="snap-center">
//                 <ReelCard reel={r} onLike={like} onShare={share} active={idx===active} />
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* nav arrows (desktop) */}
//         <button
//           className="hidden md:flex absolute right-10 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center"
//           onClick={()=>setActive(a => Math.min(a + 1, reels.length - 1))}
//         >
//           ▸
//         </button>
//         <button
//           className="hidden md:flex absolute left-10 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center"
//           onClick={()=>setActive(a => Math.max(a - 1, 0))}
//         >
//           ◂
//         </button>
//       </div>
//     </div>
//   );
// }


// src/pages/ReelsFeedPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { fetchReels, toggleReelLike, shareReel } from '@/services/reelService';
import ReelCard from '@/components/reels/ReelCard';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';    


export default function ReelsFeedPage() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [reels, setReels] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // scroll rail + item refs
  const railRef = useRef<HTMLDivElement>(null);
  const itemRefs = useMemo(
    () => [] as React.RefObject<HTMLElement>[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [/* only once */]
  );

  // Fetch
  useEffect(() => {
    if (!accessToken) return;
    fetchReels(headers).then(setReels).catch(console.error);
  }, [accessToken]);

  // Ensure refs array length matches reels length
  useEffect(() => {
    while (itemRefs.length < reels.length) itemRefs.push({ current: null } as any);
    while (itemRefs.length > reels.length) itemRefs.pop();
  }, [reels.length, itemRefs]);

  // Observe which reel is centered/mostly visible
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // pick the entry with greatest intersection ratio
        const best = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const idx = itemRefs.findIndex(r => r.current === best.target);
        if (idx !== -1) setActiveIndex(idx);
      },
      {
        root: rail,
        threshold: [0.3, 0.6, 0.9], // “mostly visible” wins
      }
    );

    itemRefs.forEach(ref => ref.current && observer.observe(ref.current));
    return () => observer.disconnect();
  }, [reels.length, itemRefs]);

  // Snap scroll helpers
  const scrollToIndex = (idx: number) => {
    const rail = railRef.current;
    const el = itemRefs[idx]?.current;
    if (!rail || !el) return;
    rail.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
  };

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        const next = Math.min(activeIndex + 1, reels.length - 1);
        scrollToIndex(next);
      }
      if (e.key === 'ArrowUp') {
        const prev = Math.max(activeIndex - 1, 0);
        scrollToIndex(prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, reels.length]);

  const like = async (id: number) => {
    const { liked } = await toggleReelLike(id, headers);
    setReels(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, hasLiked: liked, likeCount: r.likeCount + (liked ? 1 : -1) }
          : r
      )
    );
  };

  const share = async (id: number) => {
    await shareReel(id, headers);
    setReels(prev => prev.map(r => (r.id === id ? { ...r, shareCount: r.shareCount + 1 } : r)));
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      <Navbar />

      {/* Only this element scrolls */}
      <Link
  to="/reels/create"
  className="fixed right-6 top-[88px] z-30 hidden md:inline-flex items-center gap-2 
             bg-white/90 hover:bg-white text-gray-900 px-3 py-2 rounded-full shadow"
>
  <Plus className="h-4 w-4" /> Create reel
</Link>
      <div
        ref={railRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory"
      >
        {reels.map((r, idx) => (
          <section
            key={r.id}
            ref={el => (itemRefs[idx] = { current: el } as any)}
            className="
              snap-start
              h-[calc(100vh-72px)]   /* full height minus navbar */
              flex items-center justify-center
            "
          >
            {/* Fixed 9:16 size that feels like FB reels */}
            <div className="w-full flex justify-center">
              <ReelCard
                reel={r}
                onLike={like}
                onShare={share}
                active={idx === activeIndex}
              />
            </div>
          </section>
        ))}
      </div>

      {/* Next/Prev arrows (desktop) */}
      {reels.length > 1 && (
        <>
          <button
            onClick={() => scrollToIndex(Math.max(activeIndex - 1, 0))}
            className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center"
          >
            ◂
          </button>
          <button
            onClick={() => scrollToIndex(Math.min(activeIndex + 1, reels.length - 1))}
            className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center"
          >
            ▸
          </button>
        </>
      )}
    </div>
  );
}
