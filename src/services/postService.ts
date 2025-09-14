const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data && (data.error || data.message)) || 'Request failed');
  return data as T;
}

export type MediaInput = { url: string; type: 'image'|'video' };

export async function uploadMedia(files: File[],headers:Record<string,string>): Promise<MediaInput[]> {
  if (!files || files.length === 0) return [];
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  const res = await fetch(`${API_BASE_URL}/api/media/upload`, {
    method: 'POST',
    body: form,
    headers:headers,
    credentials: 'include'
  });
  const { urls } = await handle<{ urls: string[] }>(res);
  // Infer type by extension (server put in images/ vs videos/)
  return urls.map(u => ({
    url: u,
    type: u.match(/\/videos\//) ? 'video' : 'image'
  }));
}

export async function fetchPosts(headers: HeadersInit, offset = 0, limit = 20) {
  const url = new URL(`${API_BASE_URL}/api/posts?withPromoted=1`);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));

  const r = await fetch(url.toString(), { headers });
  const data = await r.json();
  return data || [];
}

// export async function fetchPosts(headers: Record<string,string>) {
//   const res = await fetch(`${API_BASE_URL}/api/posts?withPromoted=1`, { headers, credentials: 'include' });
//   return handle<any[]>(res);
// }


export async function fetchPostDetail(id: string, headers: Record<string,string>) {
  const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, { headers, credentials: 'include' });
  return handle<any>(res);
}

export async function createPost(
  userId: string|number,
  content: string,
  media: MediaInput[],
  headers: Record<string,string>
) {
  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ userId: Number(userId), content, media })
  });
  return handle<any>(res);
}

export async function toggleLike(
  postId: string, _userId: string|number, headers: Record<string,string>
) {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/react`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reaction: 'like' })
  });
  return handle<{ liked: boolean }>(res);
}

export async function addComment(
  postId: string, _userId: string|number, content: string, headers: Record<string,string>
) {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comment`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content })
  });
  return handle<any>(res);
}

export async function sharePost(
  postId: string, _comment: string|undefined, headers: Record<string,string>
) {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/share`, {
    method: 'POST',
    headers,
    credentials: 'include'
  });
  return handle<{ ok: boolean }>(res);
}


export async function savePost(
  postId: string,
  headers: Record<string,string>
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/saves`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ postId })
  });
  if (!res.ok) throw new Error('Save post failed');
}

// unsave a post
export async function unsavePost(
  postId: string,
  headers: Record<string,string>
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/saves/${postId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers
  });
  if (!res.ok) throw new Error('Unsave post failed');
}

// fetch saved posts list
export interface SavedPost {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorUsername: string;
}
export async function fetchSavedPosts(
  headers: Record<string,string>
): Promise<SavedPost[]> {
  const res = await fetch(`${API_BASE_URL}/api/saves`, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...headers }
  });
  if (!res.ok) throw new Error('Failed to fetch saved posts');
  return res.json();
}

export async function fetchSavedPostsEnriched(
  headers: Record<string,string>
): Promise<Post[]> {
  const res = await fetch(`${API_BASE_URL}/api/saves`, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...headers }
  });
  if (!res.ok) throw new Error('Failed to load saved posts');
  return res.json();
}

export async function deletePost(postId: string, headers?: Record<string, string>) {
  const r = await fetch(`${API_BASE_URL}/api/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers,
  });
  if (!r.ok) {
    const msg = await r.text().catch(() => '');
    throw new Error(msg || 'Delete failed');
  }
  return r.json();
}







