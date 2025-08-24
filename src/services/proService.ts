const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export type ProUser = {
  id: number | string;
  name: string;
  avatar: string;
  packageName: 'GADA VIP' | 'GADA VVIP';
  paidAt: string;
};

export type TrendingTagRow = {
    id: number | string;
    name: string;
    postcount: number | string
  };

export type ProPageItem = { id: number; name: string; avatar: string; likes?: number };


export async function fetchProUsers(
  headers: Record<string,string>,
  limit = 12
): Promise<ProUser[]> {
  const res = await fetch(`${API_BASE_URL}/api/pro/users?limit=${limit}`, {
    headers,
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to load pro users');
  return res.json();
}

export async function fetchUserpackage(
  headers: Record<string,string>
): Promise<ProUser[]> {
  const res = await fetch(`${API_BASE_URL}/api/pro/activepackage`, {
    headers,
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to load pro users');
  return res.json();
}


export async function fetchTrendingTags(
  headers: Record<string,string>,
  limit = 12
): Promise<TrendingTagRow[]> {
  const res = await fetch(`${API_BASE_URL}/api/pro/trending?limit=${limit}`, {
    headers,
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to load pro users');
  return res.json();
}

export async function fetchProPages(headers: Record<string, string>, limit = 12): Promise<ProPageItem[]> {
  const url = new URL(`${API_BASE_URL}/api/pro/pages`);
  url.searchParams.set('limit', String(limit));
  const r = await fetch(url.toString(), { headers });
  if (!r.ok) throw new Error('pro-pages');
  const json = await r.json();
  return (json.items || []).map((p: any) => {
    let avatar = p.avatar || 'profile/defaultavatar.png';
    // Ensure /uploads prefix exactly once
    if (!avatar.startsWith('/uploads')) avatar = `/uploads/${avatar}`.replace('//uploads', '/uploads');
    return { id: p.id, name: p.name, avatar, likes: p.likes };
  });
}

