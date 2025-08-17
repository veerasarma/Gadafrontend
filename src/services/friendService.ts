const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending'|'accepted'|'declined';
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  profileImage?: string;
}

// send a request
export async function sendFriendRequest(
  toUserId: string, headers: Record<string,string>
): Promise<FriendRequest> {
  const res = await fetch(`${API_BASE_URL}/api/friends/requests`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type':'application/json', ...headers },
    body: JSON.stringify({ toUserId })
  });
  if (!res.ok) throw new Error('Failed to send request');
  return res.json();
}

// list requests
export async function fetchFriendRequests(
  headers: Record<string,string>
): Promise<FriendRequest[]> {
  const res = await fetch(`${API_BASE_URL}/api/friends/requests`, {
    credentials: 'include',
    headers: { Accept:'application/json', ...headers }
  });
  if (!res.ok) throw new Error('Failed to load requests');
  return res.json();
}

// respond to request
export async function respondFriendRequest(
  requestId: string,
  action: 'accepted' | 'declined',
  headers: Record<string,string>
): Promise<{ id:string; status:string }> {
  const res = await fetch(`${API_BASE_URL}/api/friends/requests/${requestId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type':'application/json', ...headers },
    body: JSON.stringify({ action })
  });
  if (!res.ok) throw new Error('Failed to respond');
  return res.json();
}

// list friends
export async function fetchFriends(
  headers: Record<string,string>
): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/api/friends/list`, {
    credentials: 'include',
    headers: { Accept:'application/json', ...headers }
  });
  if (!res.ok) throw new Error('Failed to fetch friends');
  return res.json();
}

export async function fetchFriendSuggestions(
  headers: Record<string,string>
): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/api/friends/suggestions`, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...headers }
  });
  if (!res.ok) throw new Error('Failed to fetch suggestions');
  return res.json();
}

export async function searchUsers(
  query: string,
  headers: Record<string,string>
): Promise<User[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`,
    {
      credentials: 'include',
      headers: { Accept: 'application/json', ...headers }
    }
  );
  if (!res.ok) throw new Error('User search failed');
  return res.json();
}
