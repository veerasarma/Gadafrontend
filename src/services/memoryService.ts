// src/services/memoryService.ts
import type { Post } from '@/types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

type H = Record<string, string>;

async function ok<T>(r: Response): Promise<T> {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as any)?.error || 'Request failed');
  return data as T;
}

/** Get "On This Day" posts (enriched like feed posts) */
export async function fetchMemoryPosts(headers: H): Promise<Post[]> {
  const res = await fetch(`${API_BASE_URL}/api/memories`, {
    headers,
    credentials: 'include',
  });
  return ok<Post[]>(res);
}

/** (Optional) A light list for other UIs */
export async function fetchMemories(headers: H): Promise<Post[]> {
  return fetchMemoryPosts(headers);
}
