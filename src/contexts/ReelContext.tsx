import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAuthHeader,useAuthHeaderupload } from '@/hooks/useAuthHeader';
import { Reel, fetchReels, toggleReelLike, addReelComment, shareReel } from '@/services/reelService';

type Ctx = {
  reels: Reel[];
  like: (id: number) => Promise<void>;
  share: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const ReelContext = createContext<Ctx | null>(null);
export const useReels = () => {
  const ctx = useContext(ReelContext);
  if (!ctx) throw new Error('useReels must be inside ReelProvider');
  return ctx;
};

export function ReelProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headers1 = useAuthHeaderupload(accessToken);
  const [reels, setReels] = useState<Reel[]>([]);
  const cursorRef = useRef(0);

  const refresh = async () => {
    const data = await fetchReels(headers, 0, 10);
    cursorRef.current = 10;
    setReels(data);
  };

  useEffect(() => { if (accessToken) refresh().catch(console.error); }, [accessToken]);

  const like = async (id: number) => {
    const { liked } = await toggleReelLike(id, headers);
    setReels(prev => prev.map(r => r.id === id ? {
      ...r,
      hasLiked: liked,
      likeCount: r.likeCount + (liked ? 1 : -1)
    } : r));
  };

  const share = async (id: number) => {
    await shareReel(id, headers);
    setReels(prev => prev.map(r => r.id === id ? { ...r, shareCount: r.shareCount + 1 } : r));
  };

  return (
    <ReelContext.Provider value={{ reels, like, share, refresh }}>
      {children}
    </ReelContext.Provider>
  );
}
