// src/components/live/GoLiveModal.tsx
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import {
  startLive,
  stopLive,
  createLivePost,
  type StartLiveResp,
} from "@/services/liveService";
import { toast } from "sonner";
import AgoraRTC, {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

export default function GoLiveModal({
  open,
  onOpenChange,
  onStarted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStarted?: (live: StartLiveResp) => void;
}) {
  const { user, accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "friends" | "only_me">("public");
  const [thumb, setThumb] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [liveInfo, setLiveInfo] = useState<StartLiveResp | null>(null);
  const [postId, setPostId] = useState<number | null>(null);

  // Native preview <video> before we switch to Agora local track
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  // Agora refs (during live)
  const clientRef = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null);
  const camTrackRef = useRef<ICameraVideoTrack | null>(null);
  const micTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

  // Start/stop camera preview when modal opens/closes (before live)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!open || liveInfo) return; // if already live, we show Agora track instead
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          s.getTracks().forEach(t => t.stop());
          return;
        }
        previewStreamRef.current = s;
        if (previewRef.current) {
          previewRef.current.srcObject = s;
          await previewRef.current.play().catch(() => {});
        }
      } catch {
        toast.error("Could not access camera/microphone");
      }
    })();
    return () => {
      cancelled = true;
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(t => t.stop());
        previewStreamRef.current = null;
      }
      if (previewRef.current) {
        previewRef.current.pause();
        // @ts-expect-error
        previewRef.current.srcObject = null;
      }
    };
  }, [open, liveInfo]);

  // --- Helpers to capture a PNG from camera preview / local track ---
  async function grabFromLocalTrack(): Promise<string | null> {
    const track = camTrackRef.current;
    if (!track) return null;

    try {
      // Build offscreen <video> bound to this track’s MediaStreamTrack
      const el = document.createElement("video");
      el.muted = true;
      el.playsInline = true;
      el.autoplay = true;
      const ms = new MediaStream([track.getMediaStreamTrack()]);
      el.srcObject = ms;
      await el.play().catch(() => {});

      // Try to read resolution from settings; else fallback to element
      const st: any = track.getMediaStreamTrack().getSettings?.() || {};
      const srcW = Number(st.width || el.videoWidth || 1280);
      const srcH = Number(st.height || el.videoHeight || 720);

      if (!srcW || !srcH) return null;

      const W = 1280, H = 720;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      // Dark bg
      ctx.fillStyle = "#0b0f19";
      ctx.fillRect(0, 0, W, H);

      // Letterbox/pillarbox while preserving AR
      const srcAR = srcW / srcH;
      const dstAR = W / H;
      let dw = W, dh = H, dx = 0, dy = 0;
      if (srcAR > dstAR) {
        dw = W;
        dh = Math.round(W / srcAR);
        dy = Math.round((H - dh) / 2);
      } else {
        dh = H;
        dw = Math.round(H * srcAR);
        dx = Math.round((W - dw) / 2);
      }
      ctx.drawImage(el, 0, 0, srcW, srcH, dx, dy, dw, dh);

      // LIVE tag
      ctx.fillStyle = "#ef4444";
      const bw = 100, bh = 40, r = 12, x = 24, y = 24;
      roundRect(ctx, x, y, bw, bh, r);
      ctx.fill();
      ctx.font = "bold 18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText("LIVE", x + 16, y + bh / 2);

      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }

    function roundRect(
      c: CanvasRenderingContext2D,
      x: number, y: number, w: number, h: number, rad: number
    ) {
      c.beginPath();
      c.moveTo(x + rad, y);
      c.arcTo(x + w, y, x + w, y + h, rad);
      c.arcTo(x + w, y + h, x, y + h, rad);
      c.arcTo(x, y + h, x, y, rad);
      c.arcTo(x, y, x + w, y, rad);
      c.closePath();
    }
  }

  // Capture a PNG dataURL (backend saver expects PNG when we send a dataURL)
  async function captureThumb(): Promise<string | undefined> {
    const val = thumb.trim();
    // If user pasted a dataURL, pass it as-is
    if (val.startsWith("data:image/")) return val;
    // If user gave a non-empty path/URL, let backend store that string; don’t recapture
    if (val.length > 0) return undefined;

    // Prefer a frame from the Agora local track (best quality)
    const fromTrack = await grabFromLocalTrack();
    if (fromTrack) return fromTrack;

    // Else fall back to native preview video
    const video = previewRef.current;
    if (!video) return undefined;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    } catch {
      return undefined;
    }
  }

  async function handleStart() {
    if (busy) return;
    setBusy(true);
    try {
      // 1) Ensure the post exists (the feed item)
      const createdPostId =
        postId ??
        (await createLivePost(
          { text: title || "Live", privacy, userId: user?.id ?? user?.userId },
          headers
        ));
      setPostId(createdPostId);

      // 2) Build args backend expects
      const thumbnailDataUrl = await captureThumb(); // may be undefined -> backend auto-generates
      const agoraUid = Number(user?.userId ?? user?.id ?? Date.now()); // stable uid for host
      const channelName = `live_${agoraUid}_${Date.now()}`;
    console.log(thumbnailDataUrl,'thumbnailDataUrlthumbnailDataUrlthumbnailDataUrl')
      // 3) Start live (creates/updates posts_live row, stores thumbnail if any)
      const started = await startLive(
        { postId: createdPostId, channelName, agoraUid, thumbnailDataUrl },
        headers
      );
      setLiveInfo(started);
      onStarted?.(started);

      // 4) Host token + uid (must use EXACT uid and token returned by backend)
      const r = await fetch(
        `${API_BASE}/api/live/agora/host-join?postId=${createdPostId}`,
        { credentials: "include", headers }
      );
      if (!r.ok) throw new Error(`Host join failed (${r.status})`);
      const hostInfo = await r.json() as { appId: string; channelName: string; uid: number; token: string };

      // 5) Join & publish to Agora as HOST
      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      clientRef.current = client;
      await client.setClientRole("host");
      await client.join(hostInfo.appId, hostInfo.channelName, hostInfo.token, hostInfo.uid);

      const mic = await AgoraRTC.createMicrophoneAudioTrack();
      const cam = await AgoraRTC.createCameraVideoTrack();
      micTrackRef.current = mic;
      camTrackRef.current = cam;
      await client.publish([mic, cam]);

      // Show local camera track inside the same preview box
      if (previewRef.current) {
        // Clear native preview stream if any
        if (previewStreamRef.current) {
          previewStreamRef.current.getTracks().forEach(t => t.stop());
          previewStreamRef.current = null;
          previewRef.current.pause();
          // @ts-expect-error
          previewRef.current.srcObject = null;
        }
        const container = previewRef.current.parentElement!;
        container.innerHTML = "";
        const target = document.createElement("div");
        target.style.width = "100%";
        target.style.height = "260px";
        target.style.background = "black";
        container.appendChild(target);
        await cam.play(target);
      }

      toast.success("Live started");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Could not start live");
      await safeLeaveAgora(); // best-effort cleanup
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    if (busy) return;
    setBusy(true);
    try {
      const pid = postId;

      // Stop publishing & leave Agora first
      await safeLeaveAgora();

      // Send a final thumbnail if possible (optional)
      const thumbnailDataUrl = await captureThumb();
      if (pid) {
        await stopLive(pid, headers, thumbnailDataUrl);
      }

      toast.success("Live ended");
      setLiveInfo(null);
      setPostId(null);
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to stop live");
    } finally {
      setBusy(false);
    }
  }

  async function safeLeaveAgora() {
    try {
      if (camTrackRef.current) {
        try { await camTrackRef.current.stop(); } catch {}
        try { await camTrackRef.current.close(); } catch {}
      }
      if (micTrackRef.current) {
        try { await micTrackRef.current.stop(); } catch {}
        try { await micTrackRef.current.close(); } catch {}
      }
      camTrackRef.current = null;
      micTrackRef.current = null;

      if (clientRef.current) {
        const c = clientRef.current;
        clientRef.current = null;
        try { await c.unpublish().catch(() => {}); } catch {}
        try { await c.leave().catch(() => {}); } catch {}
        c.removeAllListeners();
      }
    } catch {}
  }

  // Ensure Agora cleanup when dialog is closed “externally”
  useEffect(() => {
    if (!open) {
      void safeLeaveAgora();
    }
  }, [open]);

  const live = liveInfo?.live;

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{live ? "You are live" : "Go Live"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview / Live video pane */}
          <div className="rounded-md overflow-hidden bg-black">
            <video
              ref={previewRef}
              className="w-full h-[260px] object-contain bg-black"
              muted
              playsInline
            />
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My live…"
                disabled={!!live}
              />
            </div>

            <div>
              <Label>Privacy</Label>
              <select
                className="mt-1 w-full border rounded-md px-2 py-1 text-sm"
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as any)}
                disabled={!!live}
              >
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="only_me">Only me</option>
              </select>
            </div>

            <div>
              <Label>Thumbnail (optional URL/dataURL — leave blank to auto-capture)</Label>
              <Input
                value={thumb}
                onChange={(e) => setThumb(e.target.value)}
                placeholder="/uploads/.../thumb.png or data:image/png;base64,…"
                disabled={!!live}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                If blank, we capture a frame from your camera and upload it automatically.
              </p>
            </div>

            {live && (
              <div className="text-xs text-slate-600 p-2 bg-slate-50 rounded">
                Channel: <b>{live.channelName || "—"}</b>
                <br />
                UID: <b>{live.agoraUid ?? "—"}</b>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {!live ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleStart} disabled={busy}>
                {busy ? "Starting…" : "Start Live"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={handleStop} disabled={busy}>
                {busy ? "Stopping…" : "End Live"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
