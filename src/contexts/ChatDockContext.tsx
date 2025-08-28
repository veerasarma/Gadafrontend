import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader, useAuthHeaderupload } from "@/hooks/useAuthHeader";
import { fetchConversations, openConversationWith } from "@/services/messengerService";
import { connectSocket } from "@/services/socketClient";
import ChatDock from "@/components/messenger/ChatDock";

export type Peer = { id: number; username: string; fullName: string; avatar?: string | null };
export type WindowItem = {
  conversationId: number;
  peer: Peer;
  minimized?: boolean;
};

type Ctx = {
  windows: WindowItem[];
  openConversation: (conversationId: number, peer?: Peer) => Promise<void>;
  openChatWith: (userId: number, seed?: Peer) => Promise<void>;
  closeWindow: (conversationId: number) => void;
  minimizeWindow: (conversationId: number, v: boolean) => void;
  socket: ReturnType<typeof connectSocket> | null;
  authKey: string;
  authKeyUpload: string;
};

const ChatDockContext = createContext<Ctx | null>(null);

export function ChatDockProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersUpload = useAuthHeaderupload(accessToken);

  const authKey = (headers as any)?.Authorization ?? "";
  const authKeyUpload = (headersUpload as any)?.Authorization ?? "";

  const [windows, setWindows] = useState<WindowItem[]>([]);
  const [convCache, setConvCache] = useState<Record<number, Peer>>({});
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  // single shared socket
  useEffect(() => {
    if (!accessToken) return;
    const s = connectSocket(accessToken);
    socketRef.current = s;
    return () => { try { s.close(); } catch {} socketRef.current = null; };
  }, [accessToken]);

  // hydrate a peer from conversations list if missing
  const ensurePeer = useCallback(async (conversationId: number): Promise<Peer | null> => {
    if (convCache[conversationId]) return convCache[conversationId];
    try {
      const list = await fetchConversations(headers);
      const found = list.find(c => c.conversationId === conversationId);
      if (found) {
        setConvCache(prev => ({ ...prev, [conversationId]: found.peer }));
        return found.peer;
      }
    } catch {}
    return null;
  }, [headers, convCache]);

  const openConversation = useCallback(async (conversationId: number, peer?: Peer) => {
    const p = peer || await ensurePeer(conversationId);
    if (!p) return;
    setWindows(prev => {
      const exists = prev.some(w => w.conversationId === conversationId);
      if (exists) {
        return prev.map(w => w.conversationId === conversationId ? { ...w, minimized: false } : w);
      }
      // cap to 4 windows (oldest drops)
      const next = [...prev, { conversationId, peer: p, minimized: false }];
      return next.length > 4 ? next.slice(next.length - 4) : next;
    });
  }, [ensurePeer]);

  const openChatWith = useCallback(async (userId: number, seed?: Peer) => {
    const { conversationId } = await openConversationWith(userId, headers);
    if (seed) setConvCache(prev => ({ ...prev, [conversationId]: seed }));
    await openConversation(conversationId, seed);
  }, [headers, openConversation]);

  const closeWindow = useCallback((conversationId: number) => {
    setWindows(prev => prev.filter(w => w.conversationId !== conversationId));
  }, []);

  const minimizeWindow = useCallback((conversationId: number, v: boolean) => {
    setWindows(prev => prev.map(w => w.conversationId === conversationId ? { ...w, minimized: v } : w));
  }, []);

  const value = useMemo<Ctx>(() => ({
    windows, openConversation, openChatWith, closeWindow, minimizeWindow,
    socket: socketRef.current, authKey, authKeyUpload
  }), [windows, openConversation, openChatWith, closeWindow, minimizeWindow, authKey, authKeyUpload]);

  return (
    <ChatDockContext.Provider value={value}>
      {children}
      {/* Always mounted dock */}
      <ChatDock />
    </ChatDockContext.Provider>
  );
}

export function useChatDock() {
  const ctx = useContext(ChatDockContext);
  if (!ctx) throw new Error("useChatDock must be used within ChatDockProvider");
  return ctx;
}
