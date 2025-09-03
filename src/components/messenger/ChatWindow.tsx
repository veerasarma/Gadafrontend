// src/components/messenger/ChatWindow.tsx
// import { useEffect, useMemo, useRef, useState } from "react";
// import { useChatDock } from "@/contexts/ChatDockContext";
// import { stripUploads } from "@/lib/url";
// import { fetchMessages, markSeen, sendMessage, setTyping } from "@/services/messengerService";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { ChevronDown, ChevronUp, Image as ImageIcon, Mic, Send, X } from "lucide-react";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

// type Message = {
//   id: number;
//   authorId: number;
//   text: string;
//   image: string | null;
//   voice: string | null;
//   time: string;
// };

// export default function ChatWindow({
//   item,
// }: {
//   item: { conversationId: number; peer: any; minimized?: boolean };
// }) {
//   const { conversationId, peer } = item;
//   const { minimizeWindow, closeWindow, socket, authKey, authKeyUpload } = useChatDock();

//   const [minimized, setMinimized] = useState(Boolean(item.minimized));
//   const [msgs, setMsgs] = useState<Message[] | null>(null);
//   const [cursor, setCursor] = useState<number | null>(null);
//   const [done, setDone] = useState(false);
//   const [busy, setBusy] = useState(false);

//   const [text, setText] = useState("");
//   const [image, setImage] = useState<File | null>(null);
//   const [voice, setVoice] = useState<File | null>(null);

//   // single scroll viewport
//   const viewportRef = useRef<HTMLDivElement>(null);
//   // to avoid hard “always jump”, only auto-scroll when user is already near the bottom
//   const stickToBottomRef = useRef(true);
//   const inFlightRef = useRef(false);

//   // reflect minimized state into dock store
//   useEffect(() => {
//     minimizeWindow(conversationId, minimized);
//   }, [minimized, conversationId, minimizeWindow]);

//   // initial load per conversation
//   useEffect(() => {
//     resetAndLoad();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [conversationId]);

//   async function resetAndLoad() {
//     setMsgs(null);
//     setCursor(null);
//     setDone(false);
//     await loadMore(true);
//     // after first page, snap to bottom
//     requestAnimationFrame(() => {
//       if (viewportRef.current) {
//         viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
//       }
//     });
//   }

//   async function loadMore(reset = false) {
//     if (inFlightRef.current || (done && !reset)) return;
//     inFlightRef.current = true;
//     setBusy(true);
//     try {
//       const { items = [], nextCursor } = await fetchMessages(
//         conversationId,
//         { cursor: reset ? null : cursor, limit: 25 },
//         { Authorization: authKey }
//       );
//       // prepend older messages
//       setMsgs((prev) => (prev ? [...items, ...prev] : items));
//       setCursor(nextCursor ?? null);
//       if (!nextCursor || items.length === 0) setDone(true);
//       if (reset) await markSeen(conversationId, { Authorization: authKey });
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.error(e);
//     } finally {
//       inFlightRef.current = false;
//       setBusy(false);
//     }
//   }

//   async function onSend() {
//     if (!text && !image && !voice) return;
//     try {
//       const newMsg = await sendMessage(
//         conversationId,
//         { text, image, voice },
//         { Authorization: authKeyUpload }
//       );
//       setMsgs((prev) => (prev ? [...prev, { ...newMsg }] : [{ ...newMsg }]));
//       setText("");
//       setImage(null);
//       setVoice(null);
//     } catch (e) {
//       console.error(e);
//     }
//   }

//   // typing indicator
//   useEffect(() => {
//     const t = setTimeout(() => {
//       setTyping(conversationId, false, { Authorization: authKey }).catch(() => {});
//     }, 900);
//     return () => clearTimeout(t);
//   }, [text, conversationId, authKey]);

//   // socket live updates
//   useEffect(() => {
//     if (!socket) return;
//     const onNew = ({ message }: { message: Message & { conversationId: number } }) => {
//       if (message.conversationId !== conversationId) return;
//       setMsgs((prev) => (prev ? [...prev, message] : [message]));
//     };
//     socket.on("message:new", onNew);
//     return () => {
//       socket.off("message:new", onNew);
//     };
//   }, [socket, conversationId]);

//   // keep “stick to bottom” when new messages arrive if user is already near bottom
//   useEffect(() => {
//     if (!viewportRef.current) return;
//     if (!msgs || minimized) return;
//     if (stickToBottomRef.current) {
//       viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
//     }
//   }, [msgs, minimized]);

//   function onViewportScroll(e: React.UIEvent<HTMLDivElement>) {
//     const el = e.currentTarget;
//     const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
//     stickToBottomRef.current = distanceFromBottom < 80; // “near” bottom

//     // reach top → load older
//     if (el.scrollTop <= 0 && !busy && !done) {
//       const prevHeight = el.scrollHeight;
//       void loadMore(false).then(() => {
//         // keep the viewport anchored at the same message after prepend
//         requestAnimationFrame(() => {
//           const diff = el.scrollHeight - prevHeight;
//           el.scrollTop = diff;
//         });
//       });
//     }
//   }

//   return (
//     <div
//       className="
//         w-[320px] bg-white rounded-xl shadow-xl border border-slate-200
//         flex flex-col overflow-hidden
//         max-h-[75vh] md:max-h-[620px]
//       "
//     >
//       {/* header */}
//       <div className="h-12 px-3 rounded-t-xl bg-[#1877F2] text-white flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <Avatar className="h-7 w-7 ring-2 ring-white/20">
//             <AvatarImage
//               src={peer?.avatar ? API_BASE_URL + "/uploads/" + stripUploads(peer.avatar) : ""}
//             />
//             <AvatarFallback>
//               {(peer?.fullName || peer?.username || "?").slice(0, 1).toUpperCase()}
//             </AvatarFallback>
//           </Avatar>
//           <div className="text-sm font-medium">{peer?.fullName || peer?.username}</div>
//         </div>
//         <div className="flex items-center gap-1">
//           <Button
//             size="icon"
//             variant="ghost"
//             className="h-8 w-8 text-white hover:bg-white/10"
//             onClick={() => setMinimized((v) => !v)}
//             title={minimized ? "Expand" : "Minimize"}
//           >
//             {minimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
//           </Button>
//           <Button
//             size="icon"
//             variant="ghost"
//             className="h-8 w-8 text-white hover:bg-white/10"
//             onClick={() => closeWindow(conversationId)}
//             title="Close"
//           >
//             <X className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>

//       {/* body (single scroll area) */}
//       {!minimized && (
//         <>
//           <div
//             ref={viewportRef}
//             onScroll={onViewportScroll}
//             className="flex-1 overflow-y-auto px-2 py-2 space-y-2 bg-white"
//           >
//             {/* Top “load more” affordance for mouse users; auto-loads as well */}
//             {!done && (
//               <div className="flex justify-center py-1">
//                 <Button size="sm" variant="outline" disabled={busy} onClick={() => loadMore(false)}>
//                   {busy ? "Loading…" : "Load older"}
//                 </Button>
//               </div>
//             )}

//             {msgs?.map((m) => {
//               // simple ownership test: if author equals peer → it's theirs; otherwise mine
//               const mine = m.authorId !== peer?.id;
//               return (
//                 <div
//                   key={m.id}
//                   className={`flex ${mine ? "justify-end" : "justify-start"}`}
//                 >
//                   <div
//                     className={`max-w-[80%] rounded-2xl px-3 py-2 ${
//                       mine ? "bg-[#1877F2] text-white" : "bg-gray-100 text-gray-900"
//                     }`}
//                   >
//                     {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}

//                     {m.image && (
//                       <img
//                         src={API_BASE_URL + "/uploads/" + stripUploads(m.image)}
//                         className="rounded mt-1 max-h-64 object-cover"
//                         alt=""
//                       />
//                     )}

//                     {m.voice && (
//                       <audio controls className="mt-1">
//                         <source src={API_BASE_URL + "/uploads/" + stripUploads(m.voice)} />
//                       </audio>
//                     )}

//                     <div
//                       className={`text-[10px] mt-1 ${
//                         mine ? "text-white/80" : "text-gray-500"
//                       }`}
//                     >
//                       {new Date(m.time).toLocaleString()}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* composer */}
//           <div className="p-2 border-t flex items-center gap-2">
//             <label className="cursor-pointer">
//               <input
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 onChange={(e) => setImage(e.target.files?.[0] || null)}
//               />
//               <ImageIcon className="h-5 w-5 text-gray-600" />
//             </label>

//             <label className="cursor-pointer">
//               <input
//                 type="file"
//                 accept="audio/*"
//                 className="hidden"
//                 onChange={(e) => setVoice(e.target.files?.[0] || null)}
//               />
//               <Mic className="h-5 w-5 text-gray-600" />
//             </label>

//             <Input
//               value={text}
//               onChange={(e) => {
//                 setText(e.target.value);
//                 setTyping(conversationId, true, { Authorization: authKey }).catch(() => {});
//               }}
//               placeholder="Type a message…"
//               className="flex-1"
//             />

//             <Button onClick={onSend} disabled={!text && !image && !voice}>
//               <Send className="h-4 w-4 mr-1" /> Send
//             </Button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// src/components/messenger/ChatWindow.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useChatDock } from "@/contexts/ChatDockContext";
import { stripUploads } from "@/lib/url";
import { fetchMessages, markSeen, sendMessage, setTyping } from "@/services/messengerService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Mic,
  Square as StopSquare,
  Send,
  X,
  Reply,
  Forward,
  Check,
  CheckCheck,
  Clock4
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

type Message = {
  id: number;
  authorId: number;
  text: string;
  image: string | null;
  voice: string | null;
  time: string;              // ISO
  replyToId?: number | null; // optional (backend may ignore)
};

export default function ChatWindow({
  item,
}: {
  item: { conversationId: number; peer: any; minimized?: boolean };
}) {
  const { conversationId, peer } = item;
  const { minimizeWindow, closeWindow, socket, authKey, authKeyUpload } = useChatDock();

  const [minimized, setMinimized] = useState(Boolean(item.minimized));

  // messages & paging
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // composer state
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);

  // voice recording
  const [voice, setVoice] = useState<File | null>(null);
  const [isRec, setIsRec] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const recTimerRef = useRef<number | null>(null);
  const recStreamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<BlobPart[]>([]);

  // reply / forward
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // delivery / read (client-side)
  const sendingIds = useRef<Set<number>>(new Set());     // optimistic “sending” (temp ids)
  const seenSet = useRef<Set<number>>(new Set());        // message ids I sent that peer has seen

  // single scroll viewport
  const viewportRef = useRef<HTMLDivElement>(null);
  // smart autoscroll
  const stickToBottomRef = useRef(true);
  const inFlightRef = useRef(false);

  // reflect minimized state into dock store
  useEffect(() => {
    minimizeWindow(conversationId, minimized);
  }, [minimized, conversationId, minimizeWindow]);

  // initial load per conversation
  useEffect(() => {
    resetAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function resetAndLoad() {
    setMsgs(null);
    setCursor(null);
    setDone(false);
    await loadMore(true);
    requestAnimationFrame(() => {
      if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      }
    });
  }

  async function loadMore(reset = false) {
    if (inFlightRef.current || (done && !reset)) return;
    inFlightRef.current = true;
    setBusy(true);
    try {
      const { items = [], nextCursor } = await fetchMessages(
        conversationId,
        { cursor: reset ? null : cursor, limit: 25 },
        { Authorization: authKey }
      );
      setMsgs((prev) => (prev ? [...items, ...prev] : items));
      setCursor(nextCursor ?? null);
      if (!nextCursor || items.length === 0) setDone(true);

      if (reset) {
        // mark incoming messages as seen on first open
        await markSeen(conversationId, { Authorization: authKey }).catch(() => {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }

  // send
  async function onSend() {
    if (!text && !image && !voice) return;

    // optimistic: add a local placeholder id (negative)
    const tempId = -Math.floor(Math.random() * 1e9);
    const nowIso = new Date().toISOString();
    const optimistic: Message = {
      id: tempId,
      authorId: Number(peer?.id || 0) + 1, // mine (heuristic like original): !== peer.id
      text,
      image: image ? "blob://" : null,
      voice: voice ? "blob://" : null,
      time: nowIso,
      replyToId: replyTo?.id || undefined,
    };
    setMsgs((prev) => (prev ? [...prev, optimistic] : [optimistic]));
    sendingIds.current.add(tempId);

    try {
      const newMsg = await sendMessage(
        conversationId,
        { text, image, voice, replyToId: replyTo?.id ?? null },
        { Authorization: authKeyUpload }
      );

      // replace optimistic with persisted message
      setMsgs((prev) =>
        (prev || []).map((m) => (m.id === tempId ? { ...newMsg } : m))
      );
    } catch (e) {
      console.error(e);
      // failed → drop optimistic
      setMsgs((prev) => (prev || []).filter((m) => m.id !== tempId));
    } finally {
      sendingIds.current.delete(tempId);
      setText("");
      setImage(null);
      setVoice(null);
      setReplyTo(null);
      stopRecording(true);
    }
  }

  // typing indicator
  useEffect(() => {
    const t = setTimeout(() => {
      setTyping(conversationId, false, { Authorization: authKey }).catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [text, conversationId, authKey]);

  // socket live updates
  useEffect(() => {
    if (!socket) return;

    // new message
    const onNew = ({ message }: { message: Message & { conversationId: number } }) => {
      if (message.conversationId !== conversationId) return;
      setMsgs((prev) => (prev ? [...prev, message] : [message]));
    };

    // peer saw my messages → mark as seen
    const onSeen = (payload: { conversationId: number; messageIds?: number[] }) => {
      if (payload?.conversationId !== conversationId) return;
      const ids = payload?.messageIds || [];
      for (const id of ids) seenSet.current.add(id);
      // small refresh
      setMsgs((prev) => (prev ? [...prev] : prev));
    };

    // support single or plural channel names
    socket.on("message:new", onNew);
    socket.on("message:seen", onSeen);
    socket.on("messages:seen", onSeen);

    return () => {
      socket.off("message:new", onNew);
      socket.off("message:seen", onSeen);
      socket.off("messages:seen", onSeen);
    };
  }, [socket, conversationId]);

  // autoscroll near-bottom
  useEffect(() => {
    if (!viewportRef.current) return;
    if (!msgs || minimized) return;
    if (stickToBottomRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [msgs, minimized]);

  function onViewportScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;

    // top → load older
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

  // -------- voice recording ----------
  function tickStart() {
    if (recTimerRef.current) window.clearInterval(recTimerRef.current);
    setRecSecs(0);
    recTimerRef.current = window.setInterval(() => {
      setRecSecs((s) => s + 1);
    }, 1000) as unknown as number;
  }
  function tickStop() {
    if (recTimerRef.current) {
      window.clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recStreamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recRef.current = mr;
      recChunksRef.current = [];
      mr.ondataavailable = (e) => e.data && recChunksRef.current.push(e.data);
      mr.onstop = () => {
        try {
          const blob = new Blob(recChunksRef.current, { type: "audio/webm" });
          // create File so your existing sendMessage(formdata) still works
          const f = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
          setVoice(f);
        } catch {
          // ignore
        } finally {
          stopStream();
        }
      };
      mr.start();
      setIsRec(true);
      tickStart();
    } catch (e) {
      console.error("mic permission/record failed", e);
      // fallback: file picker still available
    }
  }

  function stopStream() {
    try {
      recStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    recStreamRef.current = null;
  }

  function stopRecording(silent = false) {
    try {
      recRef.current?.state === "recording" && recRef.current.stop();
    } catch {}
    recRef.current = null;
    setIsRec(false);
    tickStop();
    if (silent) {
      // discard chunks if caller asked to stop silently (e.g., after send)
      recChunksRef.current = [];
      stopStream();
    }
  }

  const recLabel = useMemo(() => {
    const mm = String(Math.floor(recSecs / 60)).padStart(2, "0");
    const ss = String(recSecs % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [recSecs]);

  // -------- helpers ----------
  function mineOf(m: Message) {
    // same heuristic your current file uses: mine if authorId !== peer.id
    return m.authorId !== peer?.id;
  }

  function renderStatus(m: Message) {
    if (!mineOf(m)) return null;
    const isSending = sendingIds.current.has(m.id);
    if (isSending) return <Clock4 className="h-3.5 w-3.5 opacity-70" title="Sending…" />;

    // if seenSet has id → double tick (seen); else single tick (sent)
    return seenSet.current.has(m.id)
      ? <CheckCheck className="h-3.5 w-3.5" title="Seen" />
      : <Check className="h-3.5 w-3.5 opacity-80" title="Sent" />;
  }

  function renderReplyPreview() {
    if (!replyTo) return null;
    return (
      <div className="px-2 py-1.5 border rounded-lg bg-gray-50 text-xs text-gray-700 flex items-start gap-2">
        <div className="font-medium">Replying to</div>
        <div className="min-w-0 flex-1 truncate">
          {replyTo.text || (replyTo.image ? "📷 image" : replyTo.voice ? "🎤 voice note" : "Message")}
        </div>
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setReplyTo(null)}
          aria-label="Cancel reply"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="
        w-[320px] bg-white rounded-xl shadow-xl border border-slate-200
        flex flex-col overflow-hidden
        max-h-[75vh] md:max-h-[620px]
      "
    >
      {/* header */}
      <div className="h-12 px-3 rounded-t-xl bg-[#1877F2] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 ring-2 ring-white/20">
            <AvatarImage
              src={peer?.avatar ? API_BASE_URL + "/uploads/" + stripUploads(peer.avatar) : ""}
            />
            <AvatarFallback>
              {(peer?.fullName || peer?.username || "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm font-medium">{peer?.fullName || peer?.username}</div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/10"
            onClick={() => setMinimized((v) => !v)}
            title={minimized ? "Expand" : "Minimize"}
          >
            {minimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/10"
            onClick={() => closeWindow(conversationId)}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* body (single scroll area) */}
      {!minimized && (
        <>
          <div
            ref={viewportRef}
            onScroll={onViewportScroll}
            className="flex-1 overflow-y-auto px-2 py-2 space-y-2 bg-white"
          >
            {/* manual “load older” (auto loads when you hit top too) */}
            {!done && (
              <div className="flex justify-center py-1">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => loadMore(false)}>
                  {busy ? "Loading…" : "Load older"}
                </Button>
              </div>
            )}

            {msgs?.map((m) => {
              const mine = mineOf(m);
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="group relative max-w-[80%]">
                    {/* actions on hover */}
                    <div className={`absolute ${mine ? "-left-10" : "-right-10"} top-1 opacity-0 group-hover:opacity-100 transition`}>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1 rounded hover:bg-gray-100"
                          title="Reply"
                          onClick={() => setReplyTo(m)}
                        >
                          <Reply className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-gray-100"
                          title="Forward"
                          onClick={() => {
                            // Simple, safe default: copy message into composer so user can pick who to send next.
                            // (Keeps backend untouched; user can open another chat from navbar and paste/send)
                            if (m.text) setText((t) => (t ? t + "\n\n" : "") + m.text);
                            if (m.image || m.voice) {
                              // optional: you could toast a hint for media forward
                              // toast.info("Open another chat to attach this media.");
                            }
                          }}
                        >
                          <Forward className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* bubble */}
                    <div
                      className={`rounded-2xl px-3 py-2 ${
                        mine ? "bg-[#1877F2] text-white ml-auto" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {/* reply snippet */}
                      {m.replyToId != null && (
                        <div
                          className={`mb-1 text-[11px] px-2 py-1 rounded ${
                            mine ? "bg-white/15" : "bg-white"
                          }`}
                        >
                          Reply
                        </div>
                      )}

                      {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}
                      {m.image && (
                        <img
                          src={API_BASE_URL + "/uploads/" + stripUploads(m.image)}
                          className="rounded mt-1 max-h-64 object-cover"
                          alt=""
                        />
                      )}
                      {m.voice && (
                        <audio controls className="mt-1">
                          <source src={API_BASE_URL + "/uploads/" + stripUploads(m.voice)} />
                        </audio>
                      )}

                      <div className={`mt-1 flex items-center gap-1 ${mine ? "text-white/80" : "text-gray-500"} text-[10px]`}>
                        <span>{new Date(m.time).toLocaleString()}</span>
                        {mine && <span className="ml-1">{renderStatus(m)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* composer */}
          <div className="p-2 border-t space-y-2">
            {/* reply preview */}
            {renderReplyPreview()}

            {/* recording pill OR attachments row */}
            {isRec ? (
              <div className="flex items-center justify-between px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="font-medium">Recording…</span>
                  <span className="tabular-nums">{recLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { stopRecording(true); setVoice(null); }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => stopRecording(false)}>
                    <StopSquare className="h-4 w-4 mr-1" /> Stop
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="cursor-pointer" title="Attach photo">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                  />
                  <ImageIcon className="h-5 w-5 text-gray-600" />
                </label>

                {/* Mic now toggles *recording*, file picker is fallback via long-press (context) */}
                <button
                  type="button"
                  title="Record voice note"
                  className="p-1 rounded hover:bg-gray-100"
                  onClick={() => {
                    if (voice) { setVoice(null); return; }
                    startRecording();
                  }}
                >
                  <Mic className={`h-5 w-5 ${voice ? "text-emerald-600" : "text-gray-600"}`} />
                </button>

                {/* show captured voice */}
                {voice && (
                  <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                    Voice ready
                  </span>
                )}

                <Input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setTyping(conversationId, true, { Authorization: authKey }).catch(() => {});
                  }}
                  placeholder="Type a message…"
                  className="flex-1"
                />

                <Button onClick={onSend} disabled={!text && !image && !voice}>
                  <Send className="h-4 w-4 mr-1" /> Send
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

