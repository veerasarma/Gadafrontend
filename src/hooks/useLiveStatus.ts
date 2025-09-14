// src/hooks/useLiveStatus.ts
import { useEffect, useMemo, useState } from "react";
import { fetchLiveStatus } from "@/services/liveService";

type Key = string; // postId string
type MapVal = { ended: boolean; viewers: number };

const store = {
  subs: new Map<Key, Set<(v: MapVal | null) => void>>(),
  cache: new Map<Key, MapVal>(),
  headers: {} as Record<string,string>,
  setHeaders(h: Record<string,string>) { this.headers = h || {}; },
  add(id: Key, cb: (v: MapVal | null) => void) {
    if (!this.subs.has(id)) this.subs.set(id, new Set());
    this.subs.get(id)!.add(cb);
    cb(this.cache.get(id) || null);
    tick();
  },
  remove(id: Key, cb: (v: MapVal | null) => void) {
    const s = this.subs.get(id);
    if (!s) return;
    s.delete(cb);
    if (!s.size) this.subs.delete(id);
  },
};

let timer: number | null = null;
const PERIOD = 8000;
const MAX_PER_QUERY = 50;

async function poll() {
  const ids = Array.from(store.subs.keys()).map((s) => Number(s)).filter(Boolean);
  if (!ids.length) return;

  // split to chunks
  for (let i = 0; i < ids.length; i += MAX_PER_QUERY) {
    const chunk = ids.slice(i, i + MAX_PER_QUERY);
    try {
      const map = await fetchLiveStatus(chunk, store.headers);
      for (const id of chunk) {
        const key = String(id);
        const next = map[key] || null;
        if (next) store.cache.set(key, next);
        const listeners = store.subs.get(key);
        if (listeners) listeners.forEach((fn) => fn(next));
      }
    } catch {
      /* ignore */
    }
  }
}

function tick() {
  if (timer != null) return;
  const run = async () => {
    await poll();
    timer = window.setTimeout(run, PERIOD);
  };
  run();
}

export function useLiveStatus(postId: number | string | null | undefined, headers: Record<string,string>) {
  const key = useMemo(() => (postId ? String(postId) : ""), [postId]);
  const [value, setValue] = useState<MapVal | null>(null);

  useEffect(() => { store.setHeaders(headers || {}); }, [headers]);

  useEffect(() => {
    if (!key) return;
    const cb = (v: MapVal | null) => setValue(v);
    store.add(key, cb);
    return () => store.remove(key, cb);
  }, [key]);

  return value;
}
