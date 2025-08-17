
// src/services/notificationService.ts
import { toast } from 'sonner';
export type NotificationItem = {
  id: number;
  type: string;                 // post_like, post_comment, friend_request, ...
  actorId: string;
  actorName: string;
  actorAvatar?: string | null;
  createdAt: string;            // ISO
  readAt: string | null;        // computed from seen
  seenAt: string | null;        // computed from seen
  message?: string | null;
  entityType?: string | null;   // node_type
  entityId?: string | null;     // notify_id
  href?: string;
  meta?: Record<string, any>;
};

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

async function handle(res: Response) {
  if (res.status === 401) {
    toast.error("Your session has been ended Please login again")
    localStorage.clear();
  }
  if (!res.ok) return res.json().catch(() => ({})).then((e) => { throw new Error(e.error || 'Request failed'); });
  return res.json();
}

export async function fetchNotifications(
  headers: Record<string, string>,
  opts: { cursor?: number; limit?: number } = {}
): Promise<NotificationItem[]> {
  const { cursor = 0, limit = 20 } = opts;
  const res = await fetch(`${API_BASE_URL}/api/notifications?cursor=${cursor}&limit=${limit}`, { headers, credentials: 'include' });
  return handle(res);
}

export async function fetchUnreadCount(headers: Record<string, string>): Promise<{ count: number }> {
  const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, { headers, credentials: 'include' });
  return handle(res);
}

export async function markRead(headers: Record<string, string>, ids: number[]): Promise<{ updated: number }> {
  const res = await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ids }),
  });
  return handle(res);
}

export async function markAllRead(headers: Record<string, string>): Promise<{ updated: number }> {
  const res = await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });
  return handle(res);
}

export async function markSeen(headers: Record<string, string>): Promise<{ updated: number }> {
  const res = await fetch(`${API_BASE_URL}/api/notifications/mark-seen`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });
  return handle(res);
}
