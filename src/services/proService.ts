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
