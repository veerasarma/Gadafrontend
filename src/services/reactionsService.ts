// src/services/reactionsService.ts
let _cache: ReactionItem[] | null = null;
let _inflight: Promise<ReactionItem[]> | null = null;
export type ReactionItem = { reaction: string; title: string; color?: string | null; image: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

export async function fetchReactionsCatalog(authKey?: string): Promise<ReactionItem[]> {
  if (_cache) return _cache;
  if (_inflight) return _inflight;

  _inflight = fetch(`${API_BASE}/api/posts/getreactions`, {
    headers: authKey ? { Authorization: authKey } : undefined,
  })
    .then(async (r) => {
      if (!r.ok) throw new Error(`getreactions ${r.status}`);
      const j = await r.json();
      _cache = Array.isArray(j?.data) ? j.data : [];
      return _cache;
    })
    .finally(() => { _inflight = null; });

  return _inflight;
}

// Optional helpers
export function clearReactionsCache() { _cache = null; }
export function getReactionsCache() { return _cache; }
