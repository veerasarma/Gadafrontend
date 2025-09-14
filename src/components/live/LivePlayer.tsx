import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { createClient } from "@/lib/agora";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePresence } from "@/hooks/usePresence";


const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

type Props = {
  postId: number;
  channel?: string;      // optional, but we will fetch token by channel
  open: boolean;
  onOpenChange: (v:boolean)=>void;
};
export default function LivePlayer({ postId, channel, open, onOpenChange }: Props) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  usePresence(channelId, headers);

  const videoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    if (!open) return;
    let joined = false;

    (async () => {
      try {
        setErr(null);
        const r = await fetch(`${API}/api/live/token?channel=${encodeURIComponent(channel || "")}`, {
          headers,
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Live is not active");

        const client = createClient();
        clientRef.current = client;
        await client.setClientRole("audience");

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video") {
            if (videoRef.current) {
              videoRef.current.innerHTML = "";
              user.videoTrack?.play(videoRef.current);
            }
          }
          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
        });
        client.on("user-unpublished", () => {
          if (videoRef.current) videoRef.current.innerHTML = "";
        });

        await client.join(j.appId, j.channel, j.token, j.uid);
        joined = true;

        // mark presence (optional)
        await fetch(`${API}/api/live/viewer/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ postId }),
        }).catch(()=>{});
      } catch (e:any) {
        console.error(e);
        setErr(e?.message || "Failed to join live");
      }
    })();

    return () => {
      (async () => {
        try {
          if (clientRef.current) {
            try { await clientRef.current.leave(); } catch {}
          }
          if (joined) {
            await fetch(`${API}/api/live/viewer/leave`, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...headers },
              body: JSON.stringify({ postId }),
            }).catch(()=>{});
          }
        } finally {
          clientRef.current = null;
          if (videoRef.current) videoRef.current.innerHTML = "";
        }
      })();
    };
  }, [open]); // eslint-disable-line

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Live</DialogTitle></DialogHeader>

        {err && <div className="text-red-600 text-sm mb-2">{err}</div>}

        <div className="aspect-video w-full bg-black rounded overflow-hidden">
          <div ref={videoRef} className="w-full h-full" />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
