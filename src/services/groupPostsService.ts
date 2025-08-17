// src/services/groupPostsService.ts
const API2 = import.meta.env.VITE_API_BASE_URL ?? '';
export const GroupPostsAPI = {
  async list(groupId: string|number, headers: Record<string,string>) {
    const r = await fetch(`${API2}/api/group-posts/${groupId}`, { headers });
    if (!r.ok) throw new Error('Failed to fetch posts');
    return r.json();
  },
  async create(groupId: string|number, payload: { content?: string; files?: File[] }, headers: Record<string,string>) {
    const form = new FormData();
    if (payload.content) form.append('content', payload.content);
    (payload.files || []).forEach(f => form.append('files', f));
    const r = await fetch(`${API2}/api/group-posts/${groupId}`, { method:'POST', headers, body: form });
    if (!r.ok) throw new Error('Create post failed');
    return r.json() as Promise<{ id:number }>;
  },
  async like(groupId: string|number, postId: string|number, headers: Record<string,string>) {
    const r = await fetch(`${API2}/api/group-posts/${groupId}/${postId}/like`, { method:'POST', headers });
    if (!r.ok) throw new Error('Like failed');
    return r.json();
  },
  async comment(groupId: string|number, postId: string|number, content: string, headers: Record<string,string>) {
    const r = await fetch(`${API2}/api/group-posts/${groupId}/${postId}/comment`, {
      method:'POST', headers:{...headers,'Content-Type':'application/json'}, body: JSON.stringify({ content })
    });
    if (!r.ok) throw new Error('Comment failed');
    return r.json();
  },
};
