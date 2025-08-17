// src/contexts/GroupContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { GroupAPI } from '@/services/groupService';

type GroupCtx = {
  myGroups: any[];
  discover: any[];
  refresh: () => Promise<void>;
  joinLeave: (groupId: number, isMember: boolean) => Promise<void>;
};

const Ctx = createContext<GroupCtx | null>(null);
export const useGroups = () => {
  const v = useContext(Ctx); if (!v) throw new Error('useGroups inside GroupProvider');
  return v;
};

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [myGroups, setMine] = useState<any[]>([]);
  const [discover, setDiscover] = useState<any[]>([]);

  const refresh = async () => {
    const data = await GroupAPI.myGroups(headers);
    setMine(data.mine); setDiscover(data.discover);
  };

  useEffect(() => { if (accessToken) refresh(); }, [accessToken]);

  const joinLeave = async (groupId: number, isMember: boolean) => {
    if (isMember) await GroupAPI.leave(groupId, headers);
    else {
      const { status } = await GroupAPI.join(groupId, headers);
      if (status === 'requested') return; // awaiting approval
    }
    await refresh();
  };

  const value = useMemo(() => ({ myGroups, discover, refresh, joinLeave }), [myGroups, discover]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
