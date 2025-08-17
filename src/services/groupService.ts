// src/api/groups.ts
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export type Group = {
  group_id: number;
  group_name: string;
  group_title: string;
  group_description: string | null;
  group_picture: string | null;
  group_members: number;
  group_privacy: 'public'|'closed'|'secret';
  group_date: string;
  joined?: '0'|'1';
  approved?: '0'|'1';
};

export async function fetchGroups(
  headers: Record<string,string>,
  { tab='discover', q='', cursor=0, limit=12 }:
  { tab?: 'discover'|'joined'|'mine'; q?: string; cursor?: number|null; limit?: number }
) {
  const qs = new URLSearchParams();
  qs.set('tab', tab);
  if (q) qs.set('q', q);
  if (cursor != null) qs.set('cursor', String(cursor));
  qs.set('limit', String(limit));
  const r = await fetch(`${API_BASE_URL}/api/groups?${qs.toString()}`, { headers });
  if (!r.ok) throw new Error('Failed to load groups');
  return r.json() as Promise<{items: Group[]; nextCursor: number|null;}>;
}

export async function joinGroup(headers: Record<string,string>, id: number) {
  const r = await fetch(`${API_BASE_URL}/api/groups/${id}/join`, { method:'POST', headers });
  if (!r.ok) throw new Error('Join failed');
  return r.json();
}

export async function leaveGroup(headers: Record<string,string>, id: number) {
  const r = await fetch(`${API_BASE_URL}/api/groups/${id}/leave`, { method:'DELETE', headers });
  if (!r.ok) throw new Error('Leave failed');
  return r.json();
}
