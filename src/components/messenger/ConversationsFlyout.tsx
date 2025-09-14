// src/components/messenger/ConversationsFlyout.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import { stripUploads } from "@/lib/url";
import { useChatDock } from "@/contexts/ChatDockContext";
import NewChatModal from "@/components/messenger/NewChatModal";
import { fetchConversations } from "@/services/messengerService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

type Peer = { id: number; username: string; fullName?: string; avatar?: string | null };
type Conversation = {
  conversationId: number;
  peer: Peer;
  lastText?: string | null;
  lastTime?: string | null;
  unread?: number;
};

type IncomingOffer = {
  conversationId: number;
  fromUserId: number;
  kind: "audio" | "video";
  room: string;
  callId: number;
  sdp: RTCSessionDescriptionInit;
};

declare global {
  interface Window {
    __GADA_OFFERS__?: Record<number, IncomingOffer>;
  }
}

const initials = (name: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0]!.toUpperCase())
    .slice(0, 2)
    .join("");

export default function ConversationsFlyout() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const {
    openConversation,
    openChatWith,
    ensureWindowForConversation,
    socket,
  } = useChatDock();

  // shared data
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // search
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s || !items) return items || [];
    return items.filter((c) => {
      const name = (c.peer.fullName || c.peer.username || "").toLowerCase();
      const msg = (c.lastText || "").toLowerCase();
      return name.includes(s) || msg.includes(s);
    });
  }, [q, items]);

  // modals
  const [newOpen, setNewOpen] = useState(false);

  // desktop popover & mobile sheet visibility
  const [openPopover, setOpenPopover] = useState(false);
  const [openSheet, setOpenSheet] = useState(false);

  // load conversations when flyout opens
  useEffect(() => {
    const shouldLoad = openPopover || openSheet;
    if (!shouldLoad || items) return;
    void loadConversations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPopover, openSheet]);

  async function loadConversations(reset = false) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res: any = await fetchConversations(headers);
      const list: Conversation[] = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
      const next = res?.nextCursor ?? null;

      setItems((prev) => (reset ? list : [ ...(prev || []), ...list ]));
      setCursor(next);
      setHasMore(Boolean(next));
    } catch (e: any) {
      console.error(e);
      setError("Failed to load conversations");
    } finally {
      setBusy(false);
    }
  }

  function handleOpen(c: Conversation) {
    openConversation(c.conversationId, c.peer);
    setOpenPopover(false);
    setOpenSheet(false);
  }

  // ---------- ALWAYS-ON CALL OFFER LISTENER ----------
  const attachedRef = useRef(false);
  useEffect(() => {
    if (!socket) return;

    const attach = () => {
      if (attachedRef.current) return;

      const onOffer = async (payload: any) => {
        console.log("recieved here")
        const offer: IncomingOffer = {
          conversationId: Number(payload.conversationId),
          fromUserId: Number(payload.fromUserId),
          kind: payload.kind,
          room: payload.room,
          callId: Number(payload.callId),
          sdp: payload.sdp,
        };

        // 1) Ensure the chat window is open for this conversation/user
        try {
          if (ensureWindowForConversation) {
            await ensureWindowForConversation(offer.conversationId, offer.fromUserId);
          } else if (openChatWith) {
            await openChatWith(offer.fromUserId);
          } else {
            // best-effort: keep dock logic minimal if only openConversation is available
            openConversation(offer.conversationId, {
              id: offer.fromUserId,
              username: "",
              fullName: "",
            } as any);
          }
        } catch (e) {
          console.error("[call:offer] failed to open chat window", e);
        }

        // 2) Buffer the offer globally so a window mounting slightly later can still access it
        window.__GADA_OFFERS__ = window.__GADA_OFFERS__ || {};
        window.__GADA_OFFERS__[offer.conversationId] = offer;

        // 3) Notify any already-mounted ChatWindow via a DOM event
        try {
          window.dispatchEvent(new CustomEvent("gada:call-offer", { detail: offer }));
        } catch {}
      };

      socket.on("call:offer", onOffer);
      attachedRef.current = true;

      socket.once("disconnect", () => {
        try { socket.off("call:offer", onOffer); } catch {}
        attachedRef.current = false;
      });
    };

    if (socket.connected) attach();
    socket.on("connect", attach);

    return () => {
      try { socket.off("connect", attach); } catch {}
      attachedRef.current = false;
    };
  }, [socket, ensureWindowForConversation, openConversation, openChatWith]);

  function renderList(onClose?: () => void) {
    return (
      <div className="w-full">
        {/* search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Search messages"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 bg-gray-100 border-none rounded-full focus-visible:ring-[#1877F2]"
            />
          </div>
        </div>

        {/* states */}
        {error && <div className="p-3 text-sm text-red-600">{error}</div>}
        {!error && !items && (
          <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {/* list */}
        {items && (
          <div className="max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-4 text-sm text-gray-500">No conversations</div>
            )}
            {filtered.map((c) => (
              <button
                key={c.conversationId}
                onClick={() => handleOpen(c)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={c.peer?.avatar ? API_BASE_URL + "/uploads/" + stripUploads(c.peer.avatar) : ""}
                  />
                  <AvatarFallback>{initials(c.peer.fullName || c.peer.username)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate">
                      {c.peer.fullName || c.peer.username}
                    </div>
                    {c.lastTime && (
                      <div className="ml-3 text-[11px] text-gray-500 shrink-0">
                        {new Date(c.lastTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{c.lastText || " "}</div>
                </div>
                {!!c.unread && (
                  <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-[#1877F2] text-white text-[11px]">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}

            {/* load more (if supported) */}
            {hasMore && (
              <div className="p-2">
                <Button onClick={() => loadConversations(false)} disabled={busy} variant="outline" className="w-full">
                  {busy ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* footer */}
        <div className="p-3 border-t flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setNewOpen(true)}>
            New message
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* start new chat */}
        <NewChatModal
          open={newOpen}
          onOpenChange={(v) => setNewOpen(v)}
          onPicked={async (user) => {
            await openChatWith(user.id, {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
              avatar: user.avatar,
            });
            setNewOpen(false);
            onClose?.();
          }}
        />
      </div>
    );
  }

  // ---------- RENDER ----------
  return (
    <>
      {/* Desktop: popover on the navbar icon */}
      <Popover open={openPopover} onOpenChange={setOpenPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="hidden md:inline-flex p-2 text-gray-600 hover:text-[#1877F2] hover:bg-gray-100 rounded-full"
            aria-label="Messages"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0 overflow-hidden" align="end" sideOffset={8}>
          {renderList(() => setOpenPopover(false))}
        </PopoverContent>
      </Popover>

      {/* Mobile: sheet from bottom */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden p-2 text-gray-600 hover:text-[#1877F2] hover:bg-gray-100 rounded-full"
            aria-label="Messages"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="p-0 h-[85vh] rounded-t-2xl">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-left">Messages</SheetTitle>
          </SheetHeader>
          {renderList(() => setOpenSheet(false))}
        </SheetContent>
      </Sheet>
    </>
  );
}
