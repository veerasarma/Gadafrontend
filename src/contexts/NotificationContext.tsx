// src/contexts/NotificationContext.tsx
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import {
  fetchNotifications, fetchUnreadCount, markAllRead, markRead, markSeen, NotificationItem
} from '@/services/notificationService';
import { connectSocket } from '@/services/socketClient';

type Ctx = {
  items: NotificationItem[];
  unreadCount: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsRead: (ids: number[]) => Promise<void>;
  markAll: () => Promise<void>;
  markSeenNow: () => Promise<void>;
};

const NotificationContext = createContext<Ctx | null>(null);
export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnread] = useState(0);
  const cursorRef = useRef(0);
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  const refresh = async () => {
    cursorRef.current = 0;
    const [rows, { count }] = await Promise.all([
      fetchNotifications(headers, { cursor: 0, limit: 20 }),
      fetchUnreadCount(headers),
    ]);
    setItems(rows);
    setUnread(count);
    cursorRef.current = 20;
  };

  const loadMore = async () => {
    const more = await fetchNotifications(headers, { cursor: cursorRef.current, limit: 20 });
    if (more.length) {
      setItems(prev => [...prev, ...more]);
      cursorRef.current += more.length;
    }
  };

  const markAsRead = async (ids: number[]) => {
    if (!ids.length) return;
    await markRead(headers, ids);
    setItems(prev => prev.map(n => ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n));
    setUnread(c => Math.max(0, c - ids.length));
  };

  const markAll = async () => {
    await markAllRead(headers);
    setItems(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnread(0);
  };

  const markSeenNow = async () => {
    await markSeen(headers);
    setItems(prev => prev.map(n => ({ ...n, seenAt: n.seenAt ?? new Date().toISOString() })));
  };

  // boot
  useEffect(() => {
    if (!accessToken) return;
    refresh().catch(console.error);

    const s = connectSocket(accessToken);
    socketRef.current = s;

 
    s.on('notification:new', (notif: NotificationItem) => {
      setItems(prev => [...prev,notif]);
      setUnread(c => c + 1);
    });

    return () => { s.close(); };
  }, [accessToken]);

  return (
    <NotificationContext.Provider value={{ items, unreadCount, loadMore, refresh, markAsRead, markAll, markSeenNow }}>
      {children}
    </NotificationContext.Provider>
  );
}
