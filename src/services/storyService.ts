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

export type StoryItem = {
  url: string;
  type: "image" | "video";
  meta?: StoryMeta;
};
export type Story = {
  userId: string | number;
  username: string;
  avatar: string;
  stories: StoryItem[];
};

const API_BASE_URL: string =
  (import.meta as any)?.env?.VITE_API_BASE_URL ?? "http://localhost:8085";

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
