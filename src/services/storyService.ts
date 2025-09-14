// storyService.ts — DROP-IN
export type OverlayItem = {
  id: string;
  type: "text" | "emoji";
  text: string;
  xPct: number;
  yPct: number;
  fontSize?: number;
  color?: string;
  rotateDeg?: number;
  weight?: number;
};
export type StoryMeta = {
  caption?: string;
  overlays?: OverlayItem[];
  musicUrl?: string;
  musicVolume?: number;
};

export type TextStoryMeta = {
  text: string;           // required
  bg?: string | null;     // background color (e.g. "#111111")
  color?: string | null;  // text color (e.g. "#ffffff")
  overlays?: any[] | null;
  musicUrl?: string | null;
  musicVolume?: number | null;
};


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";



export type StoryItem = {
  id: number;
  type: "image" | "video" | "text";
  url: string;            // empty for text-only
  meta?: any;             // { text, bg, color, caption, overlays, musicUrl, ... }
};
export type Story = {
  userId: number | string;
  username: string;
  avatar?: string;
  stories: StoryItem[];
};

// ---- actions used in the viewer ----
export async function fetchStoryComments(storyId: number, offset = 0, limit = 10) {
  const url = new URL(`${API_BASE_URL}/api/stories/${storyId}/comments`);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));
  const r = await fetch(url, { credentials: "include" });
  return r.json(); // { items: [...] }
}
export async function addStoryComment(storyId: number, text: string) {
  const r = await fetch(`${API_BASE_URL}/api/stories/${storyId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text }),
  });
  return r.json(); // { ok, item }
}
export async function reactStory(storyId: number, reaction: string) {
  const r = await fetch(`${API_BASE_URL}/api/stories/${storyId}/react`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reaction }),
  });
  return r.json();
}

// ---- creation ----
export async function createStory(file: File, meta?: any) {
  const fd = new FormData();
  fd.append("file", file);
  if (meta) fd.append("meta", JSON.stringify(meta));
  const r = await fetch(`${API_BASE_URL}/api/stories`, { method: "POST", body: fd, credentials: "include" });
  return r.json();
}
export async function createTextStory(meta: { text: string; bg?: string; color?: string; [k: string]: any }) {
  const r = await fetch(`${API_BASE_URL}/api/stories/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(meta),
  });
  return r.json();
}

export async function uploadStory(
  file: File,
  meta: StoryMeta,
  headers: Record<string, string>
): Promise<{ url: string; type: "image" | "video"; meta: StoryMeta }> {
  const fd = new FormData();
  fd.append("file", file);               // MUST MATCH multer.single("file")
  fd.append("meta", JSON.stringify(meta));

  const res = await fetch(`${API_BASE_URL}/api/stories`, {
    method: "POST",
    headers, // only include auth headers that are safe with multipart (no 'Content-Type')
    body: fd,
  });
  if (!res.ok) throw new Error(`uploadStory failed: ${res.status}`);
  const data = await res.json();
  // Backend responds with { url, type, meta, ... }
  return { url: data.url, type: data.type, meta: data.meta || {} };
}

export async function fetchStories(
  headers: Record<string, string>
): Promise<Story[]> {
  const res = await fetch(`${API_BASE_URL}/api/stories`, { headers });
  if (!res.ok) throw new Error(`fetchStories failed: ${res.status}`);
  const data = await res.json();
  return data;
}

export async function trackStoryView(storyId: number,headers: Record<string, string>) {
  const r = await fetch(`${API_BASE_URL}/api/stories/${storyId}/view`, { method: "POST", credentials: "include",headers:headers });
  return r.json();
}

// UPDATED: returns { ok, count, items }
export async function fetchStoryViewers(storyId: number, offset = 0, limit = 36,headers: Record<string, string>) {
  const url = new URL(`${API_BASE_URL}/api/stories/${storyId}/viewers`);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));
  const r = await fetch(url, { credentials: "include",headers:headers });
  return r.json();
}

export async function deleteStory(storyId: number,headers: Record<string, string>) {
  const r = await fetch(`${API_BASE_URL}/api/stories/${storyId}`, { method: "DELETE", credentials: "include",headers:headers });
  return r.json();
}

// NEW: log a reply intent (analytics)
export async function logStoryReplyIntent(storyId: number, toUserId: number,headers: Record<string, string>) {
  const r = await fetch(`${API_BASE_URL}/api/stories/${storyId}/reply-intent`, {
    method: "POST",
    headers:headers,
    credentials: "include",
    body: JSON.stringify({ toUserId }),
  });
  return r.json();
}


export async function addTextStory(meta: TextStoryMeta,headers) {
  const r = await fetch(`${API_BASE_URL}/api/stories/text`, {
    method: "POST",
    credentials: "include",
    headers:headers,
    body: JSON.stringify(meta),
  });
  if (!r.ok) {
    const msg = await r.text().catch(() => "");
    throw new Error(msg || "Failed to create text story");
  }
  return r.json(); // { ok: true, item: {...} }
}
