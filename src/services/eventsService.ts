const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

type H = Record<string, string>;

export function authHeaders(base: H = {}): H {
  return { 'Content-Type': 'application/json', ...base };
}

export async function listEventCategories(headers: H) {
  const r = await fetch(`${API_BASE_URL}/api/events/categories`, { headers });
  if (!r.ok) throw new Error('categories');
  return r.json();
}

export async function listEvents(params: any, headers: H) {
  const url = new URL(`${API_BASE_URL}/api/events`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  const r = await fetch(url.toString(), { headers });
  if (!r.ok) throw new Error('events');
  return r.json();
}

export async function getEvent(id: string | number, headers: H) {
  const r = await fetch(`${API_BASE_URL}/api/events/${id}`, { headers });
  if (!r.ok) throw new Error('event');
  return r.json();
}

export async function getEventMembers(id: string | number, headers: H) {
  const r = await fetch(`${API_BASE_URL}/api/events/${id}/members`, { headers });
  if (!r.ok) throw new Error('members');
  return r.json();
}

export async function rsvpEvent(id: string | number, status: 'interested'|'going'|'none', headers: H) {
  const r = await fetch(`${API_BASE_URL}/api/events/${id}/rsvp`, {
    method: 'POST',
    headers: authHeaders(headers),
    body: JSON.stringify({ status })
  });
  if (!r.ok) throw new Error('rsvp');
  return r.json();
}

export async function listMyEventInvites(headers: H) {
  const r = await fetch(`${API_BASE_URL}/api/events/invites/me`, { headers });
  if (!r.ok) throw new Error('my invites');
  return r.json();
}

export async function createEvent(payload: any, cover: File | null, headers: H) {
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => form.append(k, String(v ?? '')));
  if (cover) form.append('cover', cover);
  const r = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'POST',
    headers: { ...headers }, // no content-type so browser sets multipart
    body: form
  });
  if (!r.ok) throw new Error('create');
  const j = await r.json();
  return j.id;
}

export async function updateEventCover(id: string | number, file: File, headers: H) {
  const form = new FormData();
  form.append('cover', file);
  const r = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: 'PATCH',
    headers: { ...headers },
    body: form
  });
  if (!r.ok) throw new Error('cover');
  return r.json();
}

// (Optional) admin invite
export async function inviteToEvent(eventId: string | number, userId: number, headers: H) {
  const r = await fetch(`${API_BASE_URL}/api/events/${eventId}/invite`, {
    method: 'POST',
    headers: authHeaders(headers),
    body: JSON.stringify({ userId })
  });
  if (!r.ok) throw new Error('invite');
  return r.json();
}

export async function suggestUsers(q: string, headers: Record<string, string>) {
    // Adjust path to whatever your backend exposes for user suggestions.
    // Common options in your codebase:
    //   /users/suggest?q=..., or /search/users?q=..., or /search?q=...&type=user
    const url = new URL(`${API_BASE_URL}/api/users/suggest`);
    console.log(encodeURIComponent(q),'encodeURIComponent(q)')
    url.searchParams.set('q', encodeURIComponent(q));
    const r = await fetch(url.toString(), { headers });
    if (!r.ok) throw new Error('suggest-users');
    return r.json(); // expect [{id, username, fullName, avatar}, ...]
  }
  
