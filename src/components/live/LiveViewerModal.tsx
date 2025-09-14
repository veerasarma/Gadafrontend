// LiveViewerModal.tsx — DROP-IN self-closing modal (stays backward compatible)
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import AgoraRTC, {
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";

type Props = {
  open: boolean;
  postId: number;
  onClose: () => void;
};

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

export default function LiveViewerModal({ open, postId, onClose }: Props) {
  // Mirror external `open` so we can close immediately even if parent forgets to flip it.
  const [visible, setVisible] = useState(open);
  useEffect(() => setVisible(open), [open]);

  const videoRef = useRef<HTMLDivElement | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewers, setViewers] = useState<number>(0);

  const clientRef = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null);
  const remoteVideoRef = useRef<IRemoteVideoTrack | null>(null);
  const remoteAudioRef = useRef<IRemoteAudioTrack | null>(null);
  const beatRef = useRef<number | null>(null);
  const closingRef = useRef(false);

  const onPublishedRef = useRef<((user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => void) | null>(null);
  const onUnpublishedRef = useRef<((user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => void) | null>(null);

  const isAbort = (e: any) =>
    (typeof e?.message === "string" && e.message.includes("OPERATION_ABORTED")) ||
    e?.code === "OPERATION_ABORTED";

  const handleClose = () => {
    // Hide immediately, then clean & notify parent.
    setVisible(false);
    closingRef.current = true;
    stopHeartbeat();
    cleanupAgora();
    onClose?.();
  };

  // Close on Esc
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Join on open; cleanup on close
  useEffect(() => {
    if (!visible) {
      // if hidden, make sure we’re fully cleaned
      closingRef.current = true;
      stopHeartbeat();
      cleanupAgora();
      return;
    }

    closingRef.current = false;
    let cancelled = false;

    setError(null);
    setBusy(true);

    (async () => {
      try {
        const r = await fetch(`${API}/api/live/agora/join-info?postId=${postId}`, { credentials: "include" });
        if (!r.ok) throw new Error(`join-info ${r.status}`);
        const info = (await r.json()) as {
          appId: string;
          channelName: string;
          uid: number;
          token: string | null;
        };
        if (cancelled || closingRef.current) return;
        await startAgoraViewer(info);
        if (!cancelled && !closingRef.current) startHeartbeat();
      } catch (e: any) {
        if (!isAbort(e)) {
          console.error(e);
          setError(e?.message || "Failed to start player");
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
      closingRef.current = true;
      stopHeartbeat();
      cleanupAgora();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, postId]);

  async function startAgoraViewer(info: {
    appId: string;
    channelName: string;
    uid: number;
    token: string | null;
  }) {
    const appId = String(info?.appId || "").trim();
    const channel = String(info?.channelName || "").trim();
    const uid = Number(info?.uid);
    const token = info?.token || undefined;

    if (!appId || !channel || (!uid && uid !== 0)) {
      throw new Error("Incomplete join-info (appId/channel/uid)");
    }

    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    clientRef.current = client;

    const onPublished = async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      if (closingRef.current || !clientRef.current) return;
      try {
        await client.subscribe(user, mediaType);
      } catch (e: any) {
        if (isAbort(e)) return;
        console.error("[subscribe]", e);
        return;
      }
      if (closingRef.current) return;

      if (mediaType === "video" && user.videoTrack) {
        remoteVideoRef.current = user.videoTrack;
        if (videoRef.current) {
          videoRef.current.innerHTML = "";
          const target = document.createElement("div");
          target.style.width = "100%";
          target.style.height = "100%";
          videoRef.current.appendChild(target);
          try {
            await user.videoTrack.play(target);
          } catch (e: any) {
            if (!isAbort(e)) console.error("[video.play]", e);
          }
        }
      }
      if (mediaType === "audio" && user.audioTrack) {
        remoteAudioRef.current = user.audioTrack;
        try {
          user.audioTrack.play();
        } catch (e: any) {
          if (!isAbort(e)) console.error("[audio.play]", e);
        }
      }
    };

    const onUnpublished = () => {
      try { remoteVideoRef.current?.stop(); } catch {}
      try { remoteAudioRef.current?.stop(); } catch {}
      remoteVideoRef.current = null;
      remoteAudioRef.current = null;
    };

    onPublishedRef.current = onPublished;
    onUnpublishedRef.current = onUnpublished;

    client.on("user-published", onPublished);
    client.on("user-unpublished", onUnpublished);

    try {
      await client.setClientRole("audience");
      await client.join(appId, channel, token as any, uid);
    } catch (e: any) {
      if (isAbort(e)) return; // user closed while joining
      throw e;
    }
  }

  function startHeartbeat() {
    stopHeartbeat();
    const tick = async () => {
      if (closingRef.current) return;
      try {
        const r = await fetch(`${API}/api/live/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ postId }),
        });
        if (r.ok) {
          const j = await r.json();
          if (typeof j.viewers === "number") setViewers(j.viewers);
        }
      } catch {}
      if (!closingRef.current) {
        beatRef.current = window.setTimeout(tick, 10_000);
      }
    };
    tick();
  }

  function stopHeartbeat() {
    if (beatRef.current) {
      clearTimeout(beatRef.current);
      beatRef.current = null;
    }
  }

  function cleanupAgora() {
    const c = clientRef.current;
    if (!c) return;

    // Detach listeners first
    if (onPublishedRef.current) c.off("user-published", onPublishedRef.current);
    if (onUnpublishedRef.current) c.off("user-unpublished", onUnpublishedRef.current);
    onPublishedRef.current = null;
    onUnpublishedRef.current = null;

    try { remoteVideoRef.current?.stop(); } catch {}
    try { remoteAudioRef.current?.stop(); } catch {}
    remoteVideoRef.current = null;
    remoteAudioRef.current = null;

    c.leave().catch((e: any) => {
      if (!isAbort(e)) console.warn("[client.leave]", e);
    });
    c.removeAllListeners();
    clientRef.current = null;

    if (videoRef.current) videoRef.current.innerHTML = "";
  }

  // If not visible, render nothing (self-close)
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // backdrop click = close
        if (e.currentTarget === e.target) handleClose();
      }}
    >
      <div
        className="w-[min(920px,95vw)] max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-lg">Live</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div
            ref={videoRef}
            className="w-full h-[420px] bg-black text-white grid place-items-center rounded-lg overflow-hidden"
          >
            {busy ? (
              <span className="opacity-80">Connecting…</span>
            ) : error ? (
              <span className="text-red-400">{error}</span>
            ) : (
              <span className="opacity-60">Waiting for video…</span>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Viewers: <strong>{viewers}</strong>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
