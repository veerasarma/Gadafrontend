// src/services/reelService.ts
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export type Reel = {
  id: number;
  videoUrl: string | null;
  caption?: string;
  createdAt: string;
  authorId: number;
  authorUsername: string;
  authorProfileImage?: string | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  hasLiked: boolean;
};

export type ReelComment = {
  id: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
};

type H = Record<string, string>;

async function ok<T>(r: Response): Promise<T> {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as any)?.error || 'Request failed');
  return data as T;
}

/** Use your generic media endpoint — crucial: DO NOT set Content-Type manually */
export async function uploadReelVideo(file: File, headers: H) {
  const form = new FormData();
  form.append('files', file);
  const res = await fetch(`${API_BASE_URL}/api/media/upload`, {
    method: 'POST',
    body: form,
    headers,              // only Authorization here
    credentials: 'include',
  });
  const { urls } = await ok<{ urls: string[] }>(res);
  return urls[0]; // take first
}

export async function createReel(
  input: { videoUrl: string; caption?: string },
  headers: H
) {
  console.log(input,'inputinputinputinput')
  const res = await fetch(`${API_BASE_URL}/api/reels`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  });
  return ok<{ id: number }>(res);
}

export async function fetchReels(headers: H) {
  const res = await fetch(`${API_BASE_URL}/api/reels`, {
    headers,
    credentials: 'include',
  });
  return ok<Reel[]>(res);
}

export async function toggleReelLike(id: number, headers: H) {
  const res = await fetch(`${API_BASE_URL}/api/reels/${id}/like`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });
  return ok<{ liked: boolean }>(res);
}

export async function shareReel(id: number, headers: H) {
  const res = await fetch(`${API_BASE_URL}/api/reels/${id}/share`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });
  return ok<{ ok: true }>(res);
}

export async function getReelComments(id: number, headers: H) {
  const res = await fetch(`${API_BASE_URL}/api/reels/${id}/comments`, {
    headers,
    credentials: 'include',
  });
  return ok<ReelComment[]>(res);
}

export async function addReelComment(id: number, content: string, headers: H) {
  const res = await fetch(`${API_BASE_URL}/api/reels/${id}/comments`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
    credentials: 'include',
  });
  return ok<{ ok: true }>(res);
}
