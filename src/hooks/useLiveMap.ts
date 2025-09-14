// src/hooks/useLiveMap.ts
import { useEffect, useMemo, useRef, useState } from "react";

type LiveMap = Record<number, { live: boolean; channelId?: string; viewers?: number }>;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useLiveMap(
  headers: Record<string, string> | undefined,
  ids: number[],
  intervalMs = 15000
): LiveMap {
  const [map, setMap] = useState<LiveMap>({});
  const mountedRef = useRef(true);
  const loopIdRef = useRef(0); // bump to cancel previous loop

  // stable keys
  const idsKey = useMemo(() => {
    if (!ids || ids.length === 0) return "";
    const uniq = Array.from(new Set(ids)).sort((a, b) => a - b);
    return uniq.join(",");
  }, [ids]);

  const hdrKey = useMemo(() => headers?.Authorization ?? "", [headers?.Authorization]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!idsKey || !hdrKey) {
      setMap({});
      return;
    }

    // ensure only one loop
    const myLoopId = ++loopIdRef.current;
    let abort: AbortController | null = null;

    const shouldRun = () =>
      mountedRef.current &&
      myLoopId === loopIdRef.current &&
      typeof document !== "undefined" &&
      !document.hidden;

    const fetchOnce = async () => {
      try {
        abort?.abort();
        abort = new AbortController();
        const r = await fetch(
          `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085"}/api/live/for-posts?ids=${encodeURIComponent(
            idsKey
          )}`,
          { headers, signal: abort.signal }
        );
        if (!r.ok) return;
        const j = await r.json();
        if (!mountedRef.current || myLoopId !== loopIdRef.current) return;
        setMap(j?.data || {});
      } catch {
        // ignore; will retry on next tick
      }
    };

    let stopped = false;
    const run = async () => {
      while (!stopped && mountedRef.current && myLoopId === loopIdRef.current) {
        if (shouldRun()) {
          await fetchOnce();
        }
        // don’t stack requests
        await sleep(intervalMs);
      }
    };

    // initial fetch without waiting full interval
    void fetchOnce();
    void run();

    const vis = () => {
      // on tab refocus, immediately refresh once
      if (shouldRun()) void fetchOnce();
    };
    document.addEventListener("visibilitychange", vis);

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", vis);
      abort?.abort();
    };
  }, [idsKey, hdrKey, intervalMs, headers]);

  return map;
}
