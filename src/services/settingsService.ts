const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export type GeneralSettings = {
  id: string;
  username: string;
  email: string;
  phone?: string;
  dateOfBirth?: string; // ISO date
  gender?: 'male'|'female'|'non_binary'|'prefer_not';
  city?: string;
  country?: string;
  timezone?: string;
  language?: string;
  website?: string;
  work?: string;
  education?: string;
};

export type PrivacySettings = {
  profileVisibility: 'everyone'|'friends'|'only_me';
  friendRequestPolicy: 'everyone'|'friends_of_friends';
  lookupEmail: 'everyone'|'friends'|'only_me';
  lookupPhone: 'everyone'|'friends'|'only_me';
  showOnline: boolean;
  tagReview: boolean;
};

export type NotificationSettings = {
  inappLikes: boolean;
  inappComments: boolean;
  inappMentions: boolean;
  inappFriendRequests: boolean;
  inappGroupActivity: boolean;
  inappPayments: boolean;
  emailDigest: boolean;
  emailSecurity: boolean;
};

export async function getGeneral(headers: HeadersInit): Promise<GeneralSettings> {
  const r = await fetch(`${API}/api/settings/profile`, { headers, credentials: 'include' });
  if (!r.ok) throw new Error('Failed to fetch profile');
  return r.json();
}
export async function updateGeneral(input: Partial<GeneralSettings>, headers: HeadersInit) {
  const r = await fetch(`${API}/api/settings/profile`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error('Failed to update profile');
  return r.json();
}

export async function getPrivacy(headers: HeadersInit): Promise<PrivacySettings> {
  const r = await fetch(`${API}/api/settings/privacy`, { headers, credentials: 'include' });
  if (!r.ok) throw new Error('Failed to fetch privacy');
  return r.json();
}
export async function updatePrivacy(input: PrivacySettings, headers: HeadersInit) {
  const r = await fetch(`${API}/api/settings/privacy`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error('Failed to update privacy');
  return r.json();
}

export async function getNotifications(headers: HeadersInit): Promise<NotificationSettings> {
  const r = await fetch(`${API}/api/settings/notifications`, { headers, credentials: 'include' });
  if (!r.ok) throw new Error('Failed to fetch notifications');
  return r.json();
}
export async function updateNotifications(input: Partial<NotificationSettings>, headers: HeadersInit) {
  const r = await fetch(`${API}/api/settings/notifications`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error('Failed to update notifications');
  return r.json();
}

export async function changePassword(currentPassword: string, newPassword: string, headers: HeadersInit) {
  const r = await fetch(`${API}/api/settings/security/password`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!r.ok) throw new Error((await r.json()).error || 'Failed to change password');
  return r.json();
}

export type SessionRow = { id: string; userAgent?: string; ip?: string; createdAt: string; lastSeen?: string; };
export async function getSessions(headers: HeadersInit): Promise<SessionRow[]> {
  const r = await fetch(`${API}/api/settings/security/sessions`, { headers, credentials: 'include' });
  if (!r.ok) throw new Error('Failed to fetch sessions');
  return r.json();
}
export async function revokeSession(sessionId: string, headers: HeadersInit) {
  const r = await fetch(`${API}/api/settings/security/sessions/${sessionId}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  if (!r.ok) throw new Error('Failed to revoke session');
  return r.json();
}
