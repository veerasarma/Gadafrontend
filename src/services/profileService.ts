// src/services/profileService.ts
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export async function fetchProfileSummary(userId: string | number, headers: Record<string,string> = {}) {
  const res = await fetch(`${API_BASE_URL}/api/profile/${userId}/summary`, {
    credentials: 'include',
    headers
  });
  if (!res.ok) throw new Error('Failed to load profile summary');
  return res.json();
}

export async function fetchProfilePosts(userId: string | number, { cursor, limit = 10 } = {}, headers: Record<string,string> = {}) {
  const qs = new URLSearchParams();
  if (cursor) qs.set('cursor', String(cursor));
  if (limit) qs.set('limit', String(limit));
  const res = await fetch(`${API_BASE_URL}/api/profile/${userId}/posts?` + qs.toString(), {
    credentials: 'include',
    headers
  });
  if (!res.ok) throw new Error('Failed to load profile posts');
  return res.json(); // { items, nextCursor }
}

export async function fetchProfileFriends(userId: string | number, { cursor, limit = 24 } = {}, headers: Record<string,string> = {}) {
  const qs = new URLSearchParams();
  if (cursor) qs.set('cursor', String(cursor));
  if (limit) qs.set('limit', String(limit));
  const res = await fetch(`${API_BASE_URL}/api/profile/${userId}/friends?` + qs.toString(), {
    credentials: 'include',
    headers
  });
  if (!res.ok) throw new Error('Failed to load profile friends');
  return res.json(); // { items, nextCursor }
}
