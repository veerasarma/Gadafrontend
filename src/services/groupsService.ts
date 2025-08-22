const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

function api(path: string, params?: Record<string, any>) {
  const url = new URL(`${API_BASE_URL}/api/groups${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  return url.toString();
}

export function fetchGroupCategories(headers: Record<string, string> = {}) {
  return fetch(api('/categories'), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to load categories'); return r.json(); });
}

export function createGroup(body: any, headers: Record<string, string> = {}) {
  return fetch(api(''), {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  }).then(r => { if (!r.ok) throw new Error('Failed to create group'); return r.json(); });
}

export function listGroups(params: any, headers: Record<string, string> = {}) {
  return fetch(api('', params), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to load groups'); return r.json(); });
}

export function getGroup(idOrName: string | number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}`), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to fetch group'); return r.json(); });
}

export function updateGroupPicture(idOrName: string | number, file: File, headers: Record<string, string> = {}) {
  const fd = new FormData(); fd.append('picture', file);
  return fetch(api(`/${idOrName}/picture`), { method: 'POST', credentials: 'include', headers, body: fd })
    .then(r => { if (!r.ok) throw new Error('Failed to update picture'); return r.json(); });
}

export function updateGroupCover(idOrName: string | number, file: File, headers: Record<string, string> = {}) {
  const fd = new FormData(); fd.append('cover', file);
  return fetch(api(`/${idOrName}/cover`), { method: 'POST', credentials: 'include', headers, body: fd })
    .then(r => { if (!r.ok) throw new Error('Failed to update cover'); return r.json(); });
}

export function joinGroup(idOrName: string | number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/join`), { method: 'POST', credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to join'); return r.json(); });
}
export function leaveGroup(idOrName: string | number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/leave`), { method: 'POST', credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to leave'); return r.json(); });
}

export function fetchGroupPosts(idOrName: string | number, params: any, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/posts`, params), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to load posts'); return r.json(); });
}

export function createGroupPost(idOrName: string | number, body: any, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/posts`), {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  }).then(r => { if (!r.ok) throw new Error('Failed to create post'); return r.json(); });
}

/* -------------------------- invites & user search -------------------------- */
export function suggestGroupUsers(q: string, headers: Record<string, string> = {}) {
  return fetch(api(`/users/suggest`, { q }), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to search users'); return r.json(); });
}
export function listMyGroupInvites(headers: Record<string, string> = {}) {
  return fetch(api(`/invites`), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to load invites'); return r.json(); });
}
export function listGroupInvites(idOrName: string | number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/invites`), { credentials: 'include', headers })
    .then(r => { if (!r.ok) throw new Error('Failed to load group invites'); return r.json(); });
}
export function inviteUserToGroup(idOrName: string | number, userId: number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/invites`), {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ userId })
  }).then(r => { if (!r.ok) throw new Error('Failed to invite'); return r.json(); });
}
export function acceptGroupInvite(idOrName: string | number, inviteId: number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/invites/${inviteId}/accept`), {
    method: 'POST', credentials: 'include', headers
  }).then(r => { if (!r.ok) throw new Error('Failed to accept'); return r.json(); });
}
export function declineGroupInvite(idOrName: string | number, inviteId: number, headers: Record<string, string> = {}) {
  return fetch(api(`/${idOrName}/invites/${inviteId}/decline`), {
    method: 'POST', credentials: 'include', headers
  }).then(r => { if (!r.ok) throw new Error('Failed to decline'); return r.json(); });
}
