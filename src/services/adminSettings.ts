import { useAuthHeader } from '@/hooks/useAuthHeader';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';
export type AdminSettings = {
  general: { siteName?: string; siteUrl?: string; allowSignups?: boolean; };
  features: { stories?: boolean; reels?: boolean; groups?: boolean; payments?: boolean; };
  moderation: { maxPostLength?: number; badWords?: string[]; };
  storage: { maxUploadMB?: number; allowedImageMime?: string[]; allowedVideoMime?: string[]; };
  email: { fromName?: string; fromEmail?: string; smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPassword?: string; };
  security: { corsOrigins?: string[]; };
};

export async function fetchAllAdminSettings(headers: Record<string,string>): Promise<AdminSettings> {
  const res = await fetch(`${API_BASE_URL}api/admin/settings`, { headers });
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

export async function updateAdminSection(
  section: keyof AdminSettings,
  data: Record<string, any>,
  headers: Record<string,string>
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}api/admin/settings/${section}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.error || 'Failed to update settings');
  }
}
