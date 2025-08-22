// src/services/messengerService.ts
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export async function fetchConversations(headers: Record<string,string> = {}) {
  const res = await fetch(`${API_BASE_URL}/api/messenger/conversations`, {
    credentials: 'include',
    headers
  });
  if (!res.ok) throw new Error('Failed to load conversations');
  return res.json();
}

export async function openConversationWith(userId: number|string, headers: Record<string,string> = {}) {
  const res = await fetch(`${API_BASE_URL}/api/messenger/conversations/open`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error('Failed to open conversation');
  return res.json(); // { conversationId }
}

export async function fetchMessages(conversationId: number|string, { cursor, limit = 20 } = {}, headers: Record<string,string> = {}) {
  const qs = new URLSearchParams();
  if (cursor) qs.set('cursor', String(cursor));
  if (limit) qs.set('limit', String(limit));
  const res = await fetch(`${API_BASE_URL}/api/messenger/conversations/${conversationId}/messages?${qs.toString()}`, {
    credentials: 'include',
    headers
  });
  if (!res.ok) throw new Error('Failed to load messages');
  return res.json(); // { items, nextCursor }
}

export async function sendMessage(conversationId: number|string, { text, image, voice }: { text?: string; image?: File|null; voice?: File|null }, headers: Record<string,string> = {}) {
  const fd = new FormData();
  if (text) fd.append('message', text);
  if (image) fd.append('image', image);
  if (voice) fd.append('voice', voice);
  const res = await fetch(`${API_BASE_URL}/api/messenger/conversations/${conversationId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers, // do not set Content-Type for multipart
    body: fd
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function setTyping(conversationId: number|string, typing: boolean, headers: Record<string,string> = {}) {
  const res = await fetch(`${API_BASE_URL}/api/messenger/conversations/${conversationId}/typing`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ typing })
  });
  if (!res.ok) throw new Error('Failed to set typing');
  return res.json();
}

export async function markSeen(conversationId: number|string, headers: Record<string,string> = {}) {
  const res = await fetch(`${API_BASE_URL}/api/messenger/conversations/${conversationId}/seen`, {
    method: 'POST',
    credentials: 'include',
    headers
  });
  if (!res.ok) throw new Error('Failed to mark seen');
  return res.json();
}

export async function searchPeopleForChat(q: string, headers: Record<string,string> = {}) {
    const res = await fetch(`${API_BASE_URL}/api/messenger/users/suggest?q=${encodeURIComponent(q)}`, {
      credentials: 'include',
      headers
    });
    if (!res.ok) throw new Error('Failed to search users');
    return res.json() as Promise<Array<{ id:number; username:string; fullName:string; avatar?:string|null }>>;
  }
  
