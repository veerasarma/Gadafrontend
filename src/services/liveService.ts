// src/services/liveService.ts


const API =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:8085").replace(
    /\/+$/,
    ""
  );

function jsonOrThrow(r: Response) {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/**
 * Create a "live" post to obtain a postId.
 * Uses your standard POST /api/posts.
 * The backend should return { id } or { post_id }.
 */
// export async function createLivePost(
//   payload: { text: string; privacy: "public" | "friends" | "only_me",userId:number },
//   headers: Record<string, string>
// ): Promise<number> {
//   const res = await fetch(`${API}/api/posts`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json", ...headers },
//     body: JSON.stringify({
//       content: payload.text,
//       privacy: payload.privacy,
//       userId:payload.userId,
//       type: "live", // harmless for older backends; ignored if unsupported
//     }),
//   }).then(jsonOrThrow);

//   const pid = Number(res?.post_id ?? res?.id);
//   if (!Number.isFinite(pid)) {
//     throw new Error("Could not create post");
//   }
//   return pid;
// }

/**
 * Start live with backend expected fields.
 * body: { postId, channelName, agoraUid, thumbnailDataUrl? }
 */
// export async function startLive(
//   body: {
//     postId: number;
//     channelName: string;
//     agoraUid: number;
//     thumbnailDataUrl?: string;
//   },
//   headers: Record<string, string>
// ): Promise<StartLiveResp> {
//   const res = await fetch(`${API}/api/live/start`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json", ...headers },
//     body: JSON.stringify(body),
//   }).then(jsonOrThrow);

//   const live = res?.live || {};
//   return {
//     liveId: Number(live.liveId ?? live.live_id),
//     postId: Number(live.postId ?? live.post_id),
//     channel: String(live.channelName ?? live.agora_channel_name ?? ""),
//     uid: Number(live.agoraUid ?? live.agora_uid ?? 0),
//     thumbnail:
//       typeof live.video_thumbnail === "string" ? live.video_thumbnail : null,
//   };
// }

/**
 * Stop live. Optionally upload a final thumbnail frame.
 */
export async function stopLive(
    postId: number,
    headers: HeadersLike,
    thumbnailDataUrl?: string
  ): Promise<{ ok: boolean }> {
    const r = await fetch(`${API_BASE}/api/live/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(headers as any) },
      credentials: "include",
      body: JSON.stringify({ postId, thumbnailDataUrl }),
    });
    if (!r.ok) {
      const t = await safeText(r);
      throw new Error(`Stop live failed (${r.status}) ${t}`);
    }
    return await r.json();
  }
  
  async function safeText(r: Response) {
    try {
      return await r.text();
    } catch {
      return "";
    }
  }
  

export async function fetchLiveStatus(postIds: number[], headers: Record<string,string>) {
    if (!postIds.length) return {};
    const r = await fetch(`${API}/api/live/status?postIds=${postIds.join(",")}`, { headers });
    if (!r.ok) return {};
    return (await r.json()) as LiveStatusMap;
  }
  
  export async function joinLive(postId: number, headers: Record<string,string>) {
    await fetch(`${API}/api/live/join`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ postId }) });
  }
  export async function leaveLive(postId: number, headers: Record<string,string>) {
    await fetch(`${API}/api/live/leave`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ postId }) });
  }
  export async function heartbeatLive(postId: number, headers: Record<string,string>) {
    await fetch(`${API}/api/live/heartbeat`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ postId }) });
  }
  





  // src/services/liveService.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

export type StartLivePayload = {
  postId: number;
  channelName: string;
  agoraUid: number;
  thumbnailDataUrl?: string | null;
};

export type StartLiveResp = {
  ok: boolean;
  live: {
    liveId: number;
    postId: number;
    channelName: string;
    agoraUid: number;
    video_thumbnail?: string;
  };
};

type HeadersLike = Record<string, string | number | boolean | undefined>;

/**
 * Create the "live post" on the feed. We try a couple of common endpoints and return the new postId.
 * Adjust if your backend uses a single known endpoint.
 */
export async function createLivePost(
  payload: { type:'live',text: string; privacy: "public" | "friends" | "only_me"; userId?: number | string | null },
  headers: HeadersLike
): Promise<number> {
  const body = JSON.stringify(payload);

  // Try 1: /api/posts/live (if your backend exposes a dedicated live-creation endpoint)
  try {
    const r = await fetch(`${API_BASE}/api/posts/live`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(headers as any) },
      credentials: "include",
      body,
    });
    if (r.ok) {
      const j = await r.json();
      const id = j?.id ?? j?.postId ?? j?.data?.id;
      if (id) return Number(id);
    }
  } catch {
    /* fallthrough */
  }

  // Try 2: generic post creation
  const r2 = await fetch(`${API_BASE}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers as any) },
    credentials: "include",
    body,
  });
  if (!r2.ok) {
    const t = await safeText(r2);
    throw new Error(`Create post failed (${r2.status}) ${t}`);
  }
  const j2 = await r2.json();
  const id2 = j2?.id ?? j2?.postId ?? j2?.data?.id;
  if (!id2) throw new Error("Create post: missing id in response");
  return Number(id2);
}

/** Start live (posts_live upsert + optional thumbnail) */
export async function startLive(
  payload: StartLivePayload,
  headers: HeadersLike
): Promise<StartLiveResp> {
  const r = await fetch(`${API_BASE}/api/live/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers as any) },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await safeText(r);
    throw new Error(`Start live failed (${r.status}) ${t}`);
  }
  return (await r.json()) as StartLiveResp;
}
