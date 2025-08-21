// src/services/hashtagService.ts
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export async function fetchHashtagSummary(tag: string, headers: Record<string,string> = {}) {
  const url = `${API_BASE_URL}/api/hashtag/${encodeURIComponent(tag)}/summary`;
  const res = await fetch(url, { credentials: 'include', headers });
  if (!res.ok) throw new Error('Failed to load hashtag summary');
  return res.json();
}

export async function fetchHashtagPosts(
  tag: string,
  { cursor, limit = 10 }: { cursor?: string | null; limit?: number } = {},
  headers: Record<string,string> = {}
) {
  const qs = new URLSearchParams();
  if (cursor) qs.set('cursor', String(cursor));
  if (limit) qs.set('limit', String(limit));
  const url = `${API_BASE_URL}/api/hashtag/${encodeURIComponent(tag)}/posts?${qs.toString()}`;
  const res = await fetch(url, { credentials: 'include', headers });
  if (!res.ok) throw new Error('Failed to load hashtag posts');
  return res.json(); // { items, nextCursor }
}
