import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllRead,
  markRead,
  markSeen,
  type NotificationItem,
} from "@/services/notificationService";
import { connectSocket } from "@/services/socketClient";

type NotificationContextValue = {
  items: NotificationItem[];
  unreadCount: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsRead: (ids: number[]) => Promise<void>;
  markAll: () => Promise<void>;
  markSeenNow: () => Promise<void>;

  // 🔊 mute/unmute
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean | ((prev: boolean) => boolean)) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

const SOUND_KEY = "notif_sound_enabled";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // pagination (offset)
  const cursorRef = useRef<number>(0);
  const pageSizeRef = useRef<number>(20);

  // socket
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  // -------------------- SOUND + MUTE/UNMUTE --------------------
  const [soundEnabledState, _setSoundEnabledState] = useState<boolean>(() => {
    const s = localStorage.getItem(SOUND_KEY);
    return s === null ? true : s === "1";
  });
  const setSoundEnabled: NotificationContextValue["setSoundEnabled"] = (v) => {
    const next = typeof v === "function" ? (v as (p: boolean) => boolean)(soundEnabledState) : v;
    _setSoundEnabledState(next);
    localStorage.setItem(SOUND_KEY, next ? "1" : "0");
  };
  const soundEnabled = soundEnabledState;

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const waCtxRef = useRef<AudioContext | null>(null);
  const lastPlayMsRef = useRef(0);

  // small WebAudio fallback beep
  const playWebBeep = () => {
    const AC: typeof AudioContext =
      // @ts-ignore Safari
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!waCtxRef.current) waCtxRef.current = new AC();
    const ctx = waCtxRef.current;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.start(t);
    osc.stop(t + 0.3);
  };

  // prepare <audio> and unlock on first interaction
  useEffect(() => {
    const el = new Audio("/sounds/notify.mp3"); // put your file in public/sounds/notify.mp3
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.volume = 0.9;
    audioElRef.current = el;

    const unlock = async () => {
      try {
        await el.play();
        el.pause();
        el.currentTime = 0;
        audioUnlockedRef.current = true;
      } catch {/* ignore */}
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });

    return () => {
      try { el.pause(); } catch {}
    };
  }, []);

  const playPing = () => {
    if (!soundEnabled) return; // ← obey mute
    const now = Date.now();
    if (now - lastPlayMsRef.current < 300) return; // throttle
    lastPlayMsRef.current = now;

    const el = audioElRef.current;
    if (el && audioUnlockedRef.current) {
      el.currentTime = 0;
      el.play().catch(() => playWebBeep());
    } else {
      playWebBeep();
    }
  };
  // ------------------ END SOUND + MUTE/UNMUTE ------------------

  // --------------------------- DATA ----------------------------
  const refresh = async () => {
    cursorRef.current = 0;
    const limit = pageSizeRef.current;

    const [rows, { count }] = await Promise.all([
      fetchNotifications(headers, { cursor: 0, limit }),
      fetchUnreadCount(headers),
    ]);

    setItems(rows);
    setUnreadCount(count);
    cursorRef.current = rows.length;
  };

  const loadMore = async () => {
    const offset = cursorRef.current;
    const limit = pageSizeRef.current;
    const next = await fetchNotifications(headers, { cursor: offset, limit });
    if (next.length) {
      setItems((prev) => [...prev, ...next]);
      cursorRef.current = offset + next.length;
    }
  };

  const markAsRead = async (ids: number[]) => {
    if (!ids?.length) return;
    await markRead(headers, ids);
    setItems((prev) =>
      prev.map((n) =>
        ids.includes(n.id) ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - ids.length));
  };

  const markAll = async () => {
    await markAllRead(headers);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
  };

  const markSeenNow = async () => {
    await markSeen(headers);
    setItems((prev) => prev.map((n) => ({ ...n, seenAt: n.seenAt ?? new Date().toISOString() })));
  };
  // ------------------------- END DATA --------------------------

  // boot: initial fetch & socket
  useEffect(() => {
    if (!accessToken) return;

    refresh().catch(console.error);

    const s = connectSocket(accessToken);
    socketRef.current = s;

    // Live notifications → add to list, bump unread, play sound (if enabled)
    s.on("notification:new", (notif: NotificationItem) => {
      setItems((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
      playPing();
    });

    return () => {
      s.close();
    };
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: NotificationContextValue = {
    items,
    unreadCount,
    loadMore,
    refresh,
    markAsRead,
    markAll,
    markSeenNow,
    soundEnabled,
    setSoundEnabled,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;
