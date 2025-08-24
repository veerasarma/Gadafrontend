const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8085';

export async function fetchWatchFeed(params: { limit?: number; cursor?: number | null }, headers: Record<string, string>) {
  const url = new URL(`${API_BASE}/api/watch`);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.cursor) url.searchParams.set('cursor', String(params.cursor));
  const r = await fetch(url.toString(), { headers });
  if (!r.ok) throw new Error('watch-feed');
  return r.json() as Promise<{ items: any[]; nextCursor: number | null }>;
}
