// src/contexts/MemoryContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchMemoryPosts } from '@/services/memoryService';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types';

interface MemoryContextType {
  memories: Post[];
}

const MemoryContext = createContext<MemoryContextType | null>(null);

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [memories, setMemories] = useState<Post[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    fetchMemoryPosts(headers).then(setMemories).catch(console.error);
  }, [accessToken]);

  return (
    <MemoryContext.Provider value={{ memories }}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemories() {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error('useMemories must be inside MemoryProvider');
  return ctx;
}
