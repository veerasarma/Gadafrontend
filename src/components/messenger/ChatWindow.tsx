// src/components/messenger/ChatWindow.tsx
import { useEffect, useRef, useState } from "react";
import { useChatDock } from "@/contexts/ChatDockContext";
import { stripUploads } from "@/lib/url";
import { fetchMessages, markSeen, sendMessage, setTyping } from "@/services/messengerService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown, ChevronUp, Image as ImageIcon, Mic, Send, X,
  Phone, PhoneOff, Video, VideoOff, MicOff, Camera
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

// TURN is recommended in production
const RTC_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
  iceTransportPolicy: "all",
};

type Message = {
  id: number;
  authorId: number;
  text: string;
  image: string | null;
  voice: string | null;
  time: string;
};

/* ---------- Story reply meta helpers (NEW) ---------- */
export type StoryReplyMeta = {
  kind: "story_reply";
  story_id: number;
  story_type: "image" | "video" | "text";
  story_preview_url?: string | null;
  reply?: { emoji_code?: number | null; text?: string | null };
};

export function parseMetaEnvelope(raw: string): { meta?: StoryReplyMeta; body: string } {
  if (!raw?.startsWith("::meta::")) return { body: raw };
  const end = raw.indexOf("::/meta::");
  if (end === -1) return { body: raw };
  const jsonPart = raw.slice("::meta::".length, end);
  const body = raw.slice(end + "::/meta::".length);
  try {
    const meta = JSON.parse(jsonPart);
    return { meta, body };
  } catch {
    return { body: raw };
  }
}

export function emojiFromCode(code?: number | null): string | null {
  if (!code) return null;
  const map: Record<number, string> = { 1: "👍", 2: "❤️", 3: "😆", 4: "😲", 5: "😢", 6: "😡" };
  return map[code] || null;
}
/* ---------------------------------------------------- */

async function startCall(conversationId: number, toUserId: number, kind: "audio"|"video", authKey: string) {
  const res = await fetch(`${API_BASE_URL}/api/messenger/call/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authKey },
    body: JSON.stringify({ conversationId, toUserId, type: kind }),
  });
  if (!res.ok) throw new Error("Failed to start call");
  return res.json(); // { room, callId }
}
async function markAnswered(callId: number, kind: "audio"|"video", authKey: string) {
  void fetch(`${API_BASE_URL}/api/messenger/call/answer`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: authKey },
    body: JSON.stringify({ callId, type: kind }),
  });
}
async function endCall(callId: number, kind: "audio"|"video", authKey: string, declined?: boolean) {
  void fetch(`${API_BASE_URL}/api/messenger/call/end`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: authKey },
    body: JSON.stringify({ callId, type: kind, declined: !!declined }),
  });
}

function CallDialog({
  open, onOpenChange, kind, peer, conversationId, socket, authKey,
  incoming, offer, room: initialRoom, callId: initialCallId
}: {
  open: boolean;
  onOpenChange: (v:boolean)=>void;
  kind: "audio"|"video";
  peer: any;
  conversationId: number;
  socket: any;
  authKey: string;
  incoming?: boolean;
  offer?: RTCSessionDescriptionInit | null;
  room?: string | null;
  callId?: number | null;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection|null>(null);
  const localStreamRef = useRef<MediaStream|null>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(kind === "audio");
  const [busy, setBusy] = useState(false);
  const [callId, setCallId] = useState<number| null>(initialCallId ?? null);
  const [room, setRoom] = useState<string | null>(initialRoom ?? null);

  function ensurePC() {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(RTC_SERVERS);
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (remoteRef.current && stream) remoteRef.current.srcObject = stream;
    };
    pc.onicecandidate = (e) => {
      if (!e.candidate || !room) return;
      socket?.emit("call:candidate", { room, candidate: e.candidate });
    };
    pcRef.current = pc;
    return pc;
  }

  async function getLocal(kind: "audio"|"video") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === "video" });
    localStreamRef.current = stream;
    if (localRef.current) localRef.current.srcObject = stream;
    const pc = ensurePC();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
  }

  async function doInitiatorFlow() {
    setBusy(true);
    try {
      const res = await startCall(conversationId, peer.id, kind, authKey);
      setRoom(res.room); setCallId(res.callId);
      socket?.emit("call:join", { room: res.room });
      await getLocal(kind);
      const pc = ensurePC();
      const off = await pc.createOffer();
      await pc.setLocalDescription(off);
      socket?.emit("call:offer", { toUserId: peer.id, conversationId, kind, room: res.room, callId: res.callId, sdp: off });
    } finally { setBusy(false); }
  }

  async function doAnswerFlow(offer: RTCSessionDescriptionInit, cid: number, r: string) {
    setBusy(true);
    try {
      socket?.emit("call:join", { room: r });
      await getLocal(kind);
      const pc = ensurePC();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      socket?.emit("call:answer", { room: r, sdp: ans, callId: cid, kind, conversationId });
      await markAnswered(cid, kind, authKey);
    } finally { setBusy(false); }
  }

  useEffect(() => {
    if (!socket) return;
    const onAnswer = async ({ room: r, sdp }: { room:string; sdp: RTCSessionDescriptionInit }) => {
      if (!room || r !== room) return;
      await ensurePC().setRemoteDescription(new RTCSessionDescription(sdp));
    };
    const onCandidate = async ({ room: r, candidate }: any) => {
      if (!room || r !== room) return;
      try { await ensurePC().addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    };
    const onEnd = ({ room: r }: any) => { if (room && r === room) handleEnd(); };

    socket.on("call:answer", onAnswer);
    socket.on("call:candidate", onCandidate);
    socket.on("call:end", onEnd);
    return () => {
      socket.off("call:answer", onAnswer);
      socket.off("call:candidate", onCandidate);
      socket.off("call:end", onEnd);
    };
  }, [socket, room]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      if (incoming && offer && initialRoom && initialCallId) {
        setRoom(initialRoom); setCallId(initialCallId);
        await doAnswerFlow(offer, initialCallId, initialRoom);
      } else {
        await doInitiatorFlow();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleMute() {
    const s = localStreamRef.current; if (!s) return;
    s.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
    setMuted(!muted);
  }
  function toggleCam() {
    const s = localStreamRef.current; if (!s) return;
    s.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
    setCamOff(!camOff);
  }
  function cleanup() {
    try { pcRef.current?.getSenders().forEach(s => s.track?.stop()); } catch {}
    try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null; localStreamRef.current = null;
  }
  function handleEnd(declined?: boolean) {
    if (callId) endCall(callId, kind, authKey, declined);
    if (room) socket?.emit("call:end", { room });
    cleanup();
    onOpenChange(false);
  }

  return open ? (
    <div className="fixed inset-0 z-[95] bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-[820px] rounded-xl shadow-xl overflow-hidden">
        <div className="px-4 h-12 bg-[#1877F2] text-white flex items-center justify-between">
          <div className="font-medium">{kind === "video" ? "Video call" : "Audio call"} with {peer?.fullName || peer?.username}</div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            {kind === "video" && (
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={toggleCam} title={camOff ? "Camera on" : "Camera off"}>
                {camOff ? <VideoOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              </Button>
            )}
            <Button size="icon" variant="ghost" className="text-white hover:bg-red-500/20" onClick={() => handleEnd(false)} title="End call">
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <video ref={localRef} muted playsInline autoPlay className="w-full aspect-video bg-black rounded" />
          <video ref={remoteRef} playsInline autoPlay className="w-full aspect-video bg-black rounded" />
        </div>
        {busy && <div className="px-4 py-3 text-sm text-gray-500">Connecting…</div>}
      </div>
    </div>
  ) : null;
}

export default function ChatWindow({
  item,
  incomingOffer,
  onConsumeIncoming,
}: {
  item: { conversationId: number; peer: any; minimized?: boolean };
  incomingOffer?: {
    conversationId: number;
    fromUserId: number;
    kind: "audio" | "video";
    room: string;
    callId: number;
    sdp: RTCSessionDescriptionInit;
  };
  onConsumeIncoming?: (conversationId: number) => void;
}) {
  const { conversationId, peer } = item;
  const { minimizeWindow, closeWindow, socket, authKey, authKeyUpload } = useChatDock();

  const [minimized, setMinimized] = useState(Boolean(item.minimized));
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [voice, setVoice] = useState<File | null>(null);

  const [callOpen, setCallOpen] = useState(false);
  const [callKind, setCallKind] = useState<"audio"|"video">("audio");
  const [incoming, setIncoming] = useState<{ kind: "audio"|"video"; offer: RTCSessionDescriptionInit; room: string; callId: number; } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const inFlightRef = useRef(false);

  // === listen for call offers via DOM + socket (unchanged) ===
  useEffect(() => {
    function onDomOffer(e: Event) {
      const custom = e as CustomEvent;
      const offer = custom.detail as {
        conversationId: number;
        kind: "audio" | "video";
        room: string;
        callId: number;
        sdp: RTCSessionDescriptionInit;
      };
      if (!offer) return;
      if (offer.conversationId !== conversationId) return;
      setIncoming({ kind: offer.kind, offer: offer.sdp, room: offer.room, callId: offer.callId });
    }
    window.addEventListener("gada:call-offer", onDomOffer as EventListener);
    return () => window.removeEventListener("gada:call-offer", onDomOffer as EventListener);
  }, [conversationId]);

  useEffect(() => {
    const map = (window as any).__GADA_OFFERS__ as
      | Record<number, { conversationId: number; kind: "audio"|"video"; room: string; callId: number; sdp: RTCSessionDescriptionInit }>
      | undefined;
    if (!map) return;
    const cached = map[conversationId];
    if (cached) {
      setIncoming({ kind: cached.kind, offer: cached.sdp, room: cached.room, callId: cached.callId });
      delete map[conversationId];
    }
  }, [conversationId]);

  useEffect(() => {
    if (!incomingOffer) return;
    if (incomingOffer.conversationId !== conversationId) return;
    setIncoming({ kind: incomingOffer.kind, offer: incomingOffer.sdp, room: incomingOffer.room, callId: incomingOffer.callId });
    onConsumeIncoming?.(conversationId);
  }, [incomingOffer, conversationId, onConsumeIncoming]);

  useEffect(() => { minimizeWindow(conversationId, minimized); }, [minimized, conversationId, minimizeWindow]);

  useEffect(() => { resetAndLoad(); }, [conversationId]); // eslint-disable-line
  async function resetAndLoad() {
    setMsgs(null); setCursor(null); setDone(false);
    await loadMore(true);
    requestAnimationFrame(() => { if (viewportRef.current) viewportRef.current.scrollTop = viewportRef.current.scrollHeight; });
  }

  async function loadMore(reset = false) {
    if (inFlightRef.current || (done && !reset)) return;
    inFlightRef.current = true; setBusy(true);
    try {
      const { items = [], nextCursor } = await fetchMessages(conversationId, { cursor: reset ? null : cursor, limit: 25 }, { Authorization: authKey });
      setMsgs((prev) => (prev ? [...items, ...prev] : items));
      setCursor(nextCursor ?? null);
      if (!nextCursor || items.length === 0) setDone(true);
      if (reset) await markSeen(conversationId, { Authorization: authKey });
    } catch (e) { console.error(e); }
    finally { inFlightRef.current = false; setBusy(false); }
  }

  async function onSend() {
    if (!text && !image && !voice) return;
    try {
      const newMsg = await sendMessage(conversationId, { text, image, voice }, { Authorization: authKeyUpload });
      setMsgs((prev) => (prev ? [...prev, { ...newMsg }] : [{ ...newMsg }]));
      setText(""); setImage(null); setVoice(null);
    } catch (e) { console.error(e); }
  }

  // typing indicator
  useEffect(() => {
    const t = setTimeout(() => { setTyping(conversationId, false, { Authorization: authKey }).catch(() => {}); }, 900);
    return () => clearTimeout(t);
  }, [text, conversationId, authKey]);

  // live messages
  useEffect(() => {
    if (!socket) return;
    const onNew = ({ message }: { message: Message & { conversationId: number } }) => {
      if (message.conversationId !== conversationId) return;
      setMsgs((prev) => (prev ? [...prev, message] : [message]));
    };
    socket.on("message:new", onNew);
    return () => { socket.off("message:new", onNew); };
  }, [socket, conversationId]);

  // call offers over socket (window already open)
  useEffect(() => {
    if (!socket) return;
    const onOffer = ({ conversationId: cid, kind, room, callId, sdp }: any) => {
      if (cid !== conversationId) return;
      setIncoming({ kind, offer: sdp, room, callId });
    };
    socket.on("call:offer", onOffer);
    return () => { socket.off("call:offer", onOffer); };
  }, [socket, conversationId]);

  useEffect(() => {
    if (!viewportRef.current || !msgs || minimized) return;
    if (stickToBottomRef.current) viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [msgs, minimized]);

  function onViewportScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
    if (el.scrollTop <= 0 && !busy && !done) {
      const prevHeight = el.scrollHeight;
      void loadMore(false).then(() => {
        requestAnimationFrame(() => {
          const diff = el.scrollHeight - prevHeight;
          el.scrollTop = diff;
        });
      });
    }
  }

  return (
    <div className="w-[320px] bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden max-h-[75vh] md:max-h-[620px]">
      {/* header */}
      <div className="h-12 px-3 rounded-t-xl bg-[#1877F2] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 ring-2 ring-white/20">
            <AvatarImage src={peer?.avatar ? API_BASE_URL + "/uploads/" + stripUploads(peer.avatar) : ""} />
            <AvatarFallback>{(peer?.fullName || peer?.username || "?").slice(0,1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-sm font-medium">{peer?.fullName || peer?.username}</div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10"
                  onClick={() => { setCallKind("audio"); setCallOpen(true); }}
                  title="Audio call">
            <Phone className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10"
                  onClick={() => { setCallKind("video"); setCallOpen(true); }}
                  title="Video call">
            <Video className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10"
            onClick={() => setMinimized((v) => !v)} title={minimized ? "Expand" : "Minimize"}>
            {minimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => closeWindow(conversationId)} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* incoming call banner */}
      {incoming && (
        <div className="px-3 py-2 bg-amber-50 border-b text-sm flex items-center justify-between">
          <div>{incoming.kind === "video" ? "Video" : "Audio"} call from {peer?.fullName || peer?.username}</div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => { setCallKind(incoming.kind); setCallOpen(true); }}>Accept</Button>
            <Button size="sm" variant="secondary" onClick={() => setIncoming(null)}>Decline</Button>
          </div>
        </div>
      )}

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2" ref={viewportRef} onScroll={onViewportScroll}>
        {!msgs && <div className="text-sm text-gray-500">Loading…</div>}

        {msgs?.map((m) => {
          const mine = m.authorId !== peer?.id;
          const { meta, body } = parseMetaEnvelope(m.text || "");
          const isStoryReply = meta?.kind === "story_reply";
          const emoji = meta ? emojiFromCode(meta?.reply?.emoji_code || null) : null;
          const preview = meta?.story_preview_url || null;

          const ribbon = isStoryReply ? (
            <div className="mb-1 flex items-center gap-2 text-[11px] text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" className="text-gray-400">
                <path fill="currentColor" d="M10 17l5-5-5-5v10z"/>
              </svg>
              <span>{mine ? "You replied" : `${peer?.fullName || peer?.username || "Someone"} replied`} to {mine ? (peer?.fullName || peer?.username || "their") : "your"} story</span>
            </div>
          ) : null;

          return (
            <div key={m.id} className={`my-2 flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex gap-2`}>
                {/* bubble + ribbon */}
                <div className={`${mine ? "text-right" : "text-left"}`}>
                  {ribbon}
                  <div className={`inline-block rounded-2xl px-3 py-2 text-sm ${mine ? "bg-[#1877F2] text-white" : "bg-gray-100 text-gray-900"}`}>
                    {isStoryReply && emoji && <span className="mr-2 text-xl align-middle">{emoji}</span>}
                    {body?.trim() ? <span className="align-middle whitespace-pre-wrap break-words">{body}</span> : null}
                    {/* fallbacks for legacy image/voice messages */}
                    {!body?.trim() && m.image && (
                      <img src={API_BASE_URL + "/uploads/" + stripUploads(m.image)} className="mt-1 max-w-[220px] rounded-lg" />
                    )}
                  </div>
                </div>

                {/* story preview card */}
                {isStoryReply && preview && (
                  <a
                    href={preview}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-[64px] h-[64px] rounded-lg overflow-hidden border shadow-sm"
                    title="Open story preview"
                  >
                    <img src={preview} alt="Only text" className="w-full h-full object-cover" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* input */}
      <div className="px-2 py-2 border-t flex items-end gap-2">
        <Button size="icon" variant="ghost"><ImageIcon className="h-5 w-5" /></Button>
        <Button size="icon" variant="ghost"><Mic className="h-5 w-5" /></Button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
        />
        <Button onClick={onSend}><Send className="h-4 w-4 mr-1" />Send</Button>
      </div>

      {/* Call dialog */}
      <CallDialog
        open={callOpen}
        onOpenChange={(o) => { setCallOpen(o); if (!o) setIncoming(null); }}
        kind={callKind}
        peer={peer}
        conversationId={conversationId}
        socket={socket}
        authKey={authKey}
        incoming={!!incoming}
        offer={incoming?.offer}
        room={incoming?.room}
        callId={incoming?.callId}
      />
    </div>
  );
}
