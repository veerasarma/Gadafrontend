const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

function api(path: string, params?: Record<string, any>) {
  const url = new URL(`${API_BASE_URL}/api/pages${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  return url.toString();
}

export function fetchCategories(headers: Record<string, string> = {}) {
  return fetch(api('/categories'), { credentials: 'include', headers }).then(r => {
    if (!r.ok) throw new Error('Failed to load categories'); return r.json();
  });
}

export function createPage(body: any, headers: Record<string, string> = {}) {
  return fetch(api(''), {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  }).then(r => { if (!r.ok) throw new Error('Failed to create page'); return r.json(); });
}

export function listPages(params: any, headers: Record<string, string> = {}) {
  return fetch(api('', params), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to load pages'); return r.json(); });
}

export function getPage(idOrName: string | number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}`), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to fetch page'); return r.json(); });
}

export function updatePagePicture(idOrName: string | number, file: File, headers: Record<string, string> = {}) {
  const fd = new FormData(); fd.append('picture', file);
  return fetch(api(`/${idOrName}/picture`), { method: 'POST', credentials: 'include', headers, body: fd })
    .then(r => { if (!r.ok) throw new Error('Failed to update picture'); return r.json(); });
}

export function updatePageCover(idOrName: string | number, file: File, headers: Record<string, string> = {}) {
  const fd = new FormData(); fd.append('cover', file);
  return fetch(api(`/${idOrName}/cover`), { method: 'POST', credentials: 'include', headers, body: fd })
    .then(r => { if (!r.ok) throw new Error('Failed to update cover'); return r.json(); });
}

export function togglePageLike(idOrName: string | number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/like`), { method: 'POST', credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to like/unlike'); return r.json(); });
}

export function fetchPagePosts(idOrName: string | number, params: any, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/posts`, params), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to load posts'); return r.json(); });
}

// export function createPagePost(idOrName: string | number, body: any, headers: Record<string, string> = {}) {
//   return fetch(api(`/${idOrName}/posts`), {
//     method: 'POST', credentials: 'include',
//     headers: { 'Content-Type': 'application/json', ...headers },
//     body: JSON.stringify(body)
//   }).then(r => { if (!r.ok) throw new Error('Failed to create post'); return r.json(); });
// }

export async function createPagePost(
  handle: string,
  data: { content?: string; images?: File[]; videos?: File[] },
  headers: Record<string, string>
) {
  const fd = new FormData();
  if (data.content?.trim()) fd.append('content', data.content.trim());
  (data.images || []).forEach((f) => fd.append('images', f));
  (data.videos || []).forEach((f) => fd.append('videos', f));

  // strip json headers for multipart; keep auth if present
  const h: Record<string, string> = { ...(headers || {}) };
  delete h['Content-Type'];

  const r = await fetch(`${API_BASE_URL}/api/pages/${encodeURIComponent(handle)}/posts`, {
    method: 'POST',
    headers: h,
    body: fd,
    credentials: 'include',
  });
  if (!r.ok) {
    const t = await r.text().catch(()=>'');
    throw new Error(t || 'Failed to create page post');
  }
  return r.json();
}

/* -------------------------- invites & user search -------------------------- */
export function suggestUsers(q: string, headers: Record<string, string> = {}) {
  return fetch(api(`/users/suggest`, { q }), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to search users'); return r.json(); });
}

export function listMyInvites(headers: Record<string, string> = {}) {
  return fetch(api(`/invites`), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to load invites'); return r.json(); });
}

export function listPageInvites(idOrName: string | number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/invites`), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to load page invites'); return r.json(); });
}

export function inviteUserToPage(idOrName: string | number, userId: number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/invites`), {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ userId })
  }).then(r => { if (!r.ok) throw new Error('Failed to invite'); return r.json(); });
}

export function acceptInvite(idOrName: string | number, inviteId: number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/invites/${inviteId}/accept`), {
    method: 'POST', credentials: 'include', headers
  }).then(r => { if (!r.ok) throw new Error('Failed to accept'); return r.json(); });
}

export function declineInvite(idOrName: string | number, inviteId: number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/invites/${inviteId}/decline`), {
    method: 'POST', credentials: 'include', headers
  }).then(r => { if (!r.ok) throw new Error('Failed to decline'); return r.json(); });
}

export function togglePageBoost(idOrHandle: string | number, enable: boolean, headers: Record<string,string>) {
  return fetch(api(`/${encodeURIComponent(String(idOrHandle))}/boost`), {
    method: enable ? 'POST' : 'DELETE', credentials: 'include', headers
  }).then(r => { if (!r.ok) throw new Error('Failed to decline'); return r.json(); });
}

// export async function togglePageBoost(idOrHandle: string | number, enable: boolean, headers: Record<string,string>) {
//   const url = `${API}/pages/${encodeURIComponent(String(idOrHandle))}/boost`;
//   const r = await fetch(url, {
//     method: enable ? 'POST' : 'DELETE',
//     headers: { 'Content-Type': 'application/json', ...headers },
//   });
//   if (!r.ok) {
//     const err = await r.json().catch(()=> ({}));
//     throw new Error(err?.error || 'Boost error');
//   }
//   return r.json(); // { boosted: boolean }
// }

