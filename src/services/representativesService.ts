// src/services/representativesService.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export type RepresentativeApp = {
  id: number;
  userId: number;
  name: string;
  username: string;
  phone: string;
  email: string;
  state: string;
  residentAddress: string;
  residentialState: string;
  proposedLocation: string;
  gadaChatUsername: string;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
};

export async function getMyRepresentative(headers: Record<string, string>) {
  const res = await fetch(`${API_BASE_URL}/api/representatives/me`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load application');
  return (await res.json()) as RepresentativeApp | null;
}

export async function createRepresentative(
  payload: Omit<RepresentativeApp, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>,
  headers: Record<string, string>
) {
  const res = await fetch(`${API_BASE_URL}/api/representatives`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit');
  }
  return true;
}

export async function updateRepresentative(
  id: number,
  payload: Omit<RepresentativeApp, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>,
  headers: Record<string, string>
) {
  const res = await fetch(`${API_BASE_URL}/api/representatives/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update');
  }
  return true;
}
