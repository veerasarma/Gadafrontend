// src/components/messenger/ChatWindow.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useChatDock } from "@/contexts/ChatDockContext";
import { stripUploads } from "@/lib/url";
import { fetchMessages, markSeen, sendMessage, setTyping } from "@/services/messengerService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Image as ImageIcon, Mic, Send, X } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

type Message = {
  id: number;
  authorId: number;
  text: string;
  image: string | null;
  voice: string | null;
  time: string;
};

export default function ChatWindow({
  item,
}: {
  item: { conversationId: number; peer: any; minimized?: boolean };
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

  // single scroll viewport
  const viewportRef = useRef<HTMLDivElement>(null);
  // to avoid hard “always jump”, only auto-scroll when user is already near the bottom
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
    // after first page, snap to bottom
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
      // prepend older messages
      setMsgs((prev) => (prev ? [...items, ...prev] : items));
      setCursor(nextCursor ?? null);
      if (!nextCursor || items.length === 0) setDone(true);
      if (reset) await markSeen(conversationId, { Authorization: authKey });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }

  async function onSend() {
    if (!text && !image && !voice) return;
    try {
      const newMsg = await sendMessage(
        conversationId,
        { text, image, voice },
        { Authorization: authKeyUpload }
      );
      setMsgs((prev) => (prev ? [...prev, { ...newMsg }] : [{ ...newMsg }]));
      setText("");
      setImage(null);
      setVoice(null);
    } catch (e) {
      console.error(e);
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
    const onNew = ({ message }: { message: Message & { conversationId: number } }) => {
      if (message.conversationId !== conversationId) return;
      setMsgs((prev) => (prev ? [...prev, message] : [message]));
    };
    socket.on("message:new", onNew);
    return () => {
      socket.off("message:new", onNew);
    };
  }, [socket, conversationId]);

  // keep “stick to bottom” when new messages arrive if user is already near bottom
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
    stickToBottomRef.current = distanceFromBottom < 80; // “near” bottom

    // reach top → load older
    if (el.scrollTop <= 0 && !busy && !done) {
      const prevHeight = el.scrollHeight;
      void loadMore(false).then(() => {
        // keep the viewport anchored at the same message after prepend
        requestAnimationFrame(() => {
          const diff = el.scrollHeight - prevHeight;
          el.scrollTop = diff;
        });
      });
    }
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
            {/* Top “load more” affordance for mouse users; auto-loads as well */}
            {!done && (
              <div className="flex justify-center py-1">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => loadMore(false)}>
                  {busy ? "Loading…" : "Load older"}
                </Button>
              </div>
            )}

            {msgs?.map((m) => {
              // simple ownership test: if author equals peer → it's theirs; otherwise mine
              const mine = m.authorId !== peer?.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      mine ? "bg-[#1877F2] text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
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

                    <div
                      className={`text-[10px] mt-1 ${
                        mine ? "text-white/80" : "text-gray-500"
                      }`}
                    >
                      {new Date(m.time).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* composer */}
          <div className="p-2 border-t flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              <ImageIcon className="h-5 w-5 text-gray-600" />
            </label>

            <label className="cursor-pointer">
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setVoice(e.target.files?.[0] || null)}
              />
              <Mic className="h-5 w-5 text-gray-600" />
            </label>

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
        </>
      )}
    </div>
  );
}
