// src/services/pagesService.ts
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export function api(path: string, params?: Record<string, any>) {
  const url = new URL(`${API_BASE_URL}/api/pages${path}`);
  if (params) Object.entries(params).forEach(([k,v]) => (v != null && url.searchParams.set(k, String(v))));
  return url.toString();
}

export async function fetchCategories(headers: Record<string,string> = {}) {
  const res = await fetch(api('/categories'), { credentials: 'include', headers });
  if (!res.ok) throw new Error('Failed to load categories');
  return res.json() as Promise<Array<{category_id:number; category_parent_id:number; category_name:string; category_order:number}>>;
}

export async function createPage(body: any, headers: Record<string,string> = {}) {
  const res = await fetch(api(''), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to create page');
  return res.json();
}

export async function listPages(params: any, headers: Record<string,string> = {}) {
  const res = await fetch(api('', params), { credentials: 'include', headers });
  if (!res.ok) throw new Error('Failed to load pages');
  return res.json(); // { items, nextCursor }
}

export async function getPage(idOrName: string|number, headers: Record<string,string> = {}) {
  const res = await fetch(api(`/${idOrName}`), { credentials: 'include', headers });
  if (!res.ok) throw new Error('Failed to fetch page');
  return res.json();
}

export async function updatePagePicture(idOrName: string|number, file: File, headers: Record<string,string> = {}) {
  const fd = new FormData();
  fd.append('picture', file);
  const res = await fetch(api(`/${idOrName}/picture`), { method: 'POST', credentials: 'include', headers, body: fd });
  if (!res.ok) throw new Error('Failed to update picture');
  return res.json();
}

export async function updatePageCover(idOrName: string|number, file: File, headers: Record<string,string> = {}) {
  const fd = new FormData();
  fd.append('cover', file);
  const res = await fetch(api(`/${idOrName}/cover`), { method: 'POST', credentials: 'include', headers, body: fd });
  if (!res.ok) throw new Error('Failed to update cover');
  return res.json();
}

export async function togglePageLike(idOrName: string|number, headers: Record<string,string> = {}) {
  const res = await fetch(api(`/${idOrName}/like`), { method: 'POST', credentials: 'include', headers });
  if (!res.ok) throw new Error('Failed to like/unlike');
  return res.json(); // { hasLiked }
}

export async function fetchPagePosts(idOrName: string|number, params: any, headers: Record<string,string> = {}) {
  const res = await fetch(api(`/${idOrName}/posts`, params), { credentials: 'include', headers });
  if (!res.ok) throw new Error('Failed to load posts');
  return res.json(); // { items, nextCursor }
}

export async function createPagePost(idOrName: string|number, body: any, headers: Record<string,string> = {}) {
  const res = await fetch(api(`/${idOrName}/posts`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to create post');
  return res.json();
}
