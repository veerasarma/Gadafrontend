import { useAuthHeader } from '@/hooks/useAuthHeader';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/'; 

export interface AdminMe {
  id: string;
  username: string;
  firstname?: string;
  lastname?: string;
  email: string;
  bio?: string;
  timezone?: string;
  profileImage?: string;
  createdAt: string;
}

export async function getAdminMe(headers: Record<string,string>): Promise<AdminMe> {
  const r = await fetch(`${API_BASE_URL}api/admin/profile/me`, { headers });
  if (!r.ok) throw new Error('Failed to fetch profile');
  return r.json();
}

export async function updateAdminProfile(
  data: Partial<Pick<AdminMe, 'username'|'firstname'|'lastname'|'email'|'bio'|'timezone'>>,
  headers: Record<string,string>
): Promise<void> {
  const r = await fetch(`${API_BASE_URL}api/admin/profile`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const e = await r.json().catch(()=>({}));
    throw new Error(e.error || 'Failed to update profile');
  }
}

export async function changeAdminPassword(
  oldPassword: string,
  newPassword: string,
  headers: Record<string,string>
): Promise<void> {
  const r = await fetch(`${API_BASE_URL}api/admin/profile/password`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  if (!r.ok) {
    const e = await r.json().catch(()=>({}));
    throw new Error(e.error || 'Failed to change password');
  }
}

export async function uploadAdminAvatar(
  file: File,
  headers: Record<string,string>
): Promise<string> {
  const form = new FormData();
  form.append('avatar', file);
  const r = await fetch(`${API_BASE_URL}api/admin/profile/avatar`, {
    method: 'PUT',
    headers, // do NOT add Content-Type; browser sets multipart boundary
    body: form,
  });
  if (!r.ok) {
    const e = await r.json().catch(()=>({}));
    throw new Error(e.error || 'Upload failed');
  }
  const { avatarUrl } = await r.json();
  return avatarUrl;
}

export interface AdminSession {
  id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  lastSeen?: string;
}

export async function fetchAdminSessions(headers: Record<string,string>): Promise<AdminSession[]> {
  const r = await fetch(`${API_BASE_URL}api/admin/profile/sessions`, { headers });
  if (!r.ok) throw new Error('Failed to load sessions');
  return r.json();
}

export async function revokeAdminSession(id: string, headers: Record<string,string>): Promise<void> {
  const r = await fetch(`${API_BASE_URL}api/admin/profile/sessions/${id}`, { method: 'DELETE', headers });
  if (!r.ok) throw new Error('Failed to revoke session');
}
