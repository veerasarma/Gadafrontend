// src/hooks/usePresence.ts
import { useEffect, useRef } from "react";
import { heartbeatLive, joinLive, leaveLive } from "@/services/liveService";

export function usePresence(open: boolean, postId: number | null, headers: Record<string,string>) {
  const hbRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !postId) return;

    let alive = true;

    (async () => {
      try { await joinLive(postId, headers); } catch {}
      if (!alive) return;

      const beat = async () => { try { await heartbeatLive(postId, headers); } catch {} };
      hbRef.current = window.setInterval(beat, 20000) as unknown as number;

      const onUnload = async () => { try { await leaveLive(postId, headers); } catch {} };
      window.addEventListener("beforeunload", onUnload);

      const onVis = () => {
        if (document.visibilityState === "hidden") { onUnload(); }
      };
      document.addEventListener("visibilitychange", onVis);

      return () => {
        window.removeEventListener("beforeunload", onUnload);
        document.removeEventListener("visibilitychange", onVis);
      };
    })();

    return () => {
      alive = false;
      if (hbRef.current) { clearInterval(hbRef.current); hbRef.current = null; }
      leaveLive(postId, headers).catch(() => {});
    };
  }, [open, postId, headers]);
}
