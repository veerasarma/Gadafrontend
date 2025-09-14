// src/components/messenger/ChatDock.tsx
import { useEffect, useRef, useState } from "react";
import { useChatDock } from "@/contexts/ChatDockContext";
import ChatWindow from "@/components/messenger/ChatWindow";

type IncomingOffer = {
  conversationId: number;
  fromUserId: number;
  kind: "audio" | "video";
  room: string;
  callId: number;
  sdp: RTCSessionDescriptionInit;
};

function CallOfferBridge({
  stashIncoming,
}: {
  stashIncoming: (offer: IncomingOffer) => void;
}) {
  const { socket } = useChatDock();
  const attachedRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const attach = () => {
      if (attachedRef.current) return;

      const onOffer = (payload: any) => {
        console.log('emit received')
        const offer: IncomingOffer = {
          conversationId: Number(payload.conversationId),
          fromUserId: Number(payload.fromUserId),
          kind: payload.kind,
          room: payload.room,
          callId: Number(payload.callId),
          sdp: payload.sdp,
        };
        stashIncoming(offer);
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
  }, [socket, stashIncoming]);

  return null;
}

export default function ChatDock() {
  // Your ChatDock context may expose different helpers depending on your app.
  // We'll try them in order so this works with your current API.
  const {
    windows,
    socket,
    ensureWindowForConversation, // (cid, peerId) => Promise<void>
    openConversation,            // (cid, peer)   => void
    openChatWith,                // (userId, peer?) => Promise<void>
    openWindowForUser,           // (userId) => Promise<void>
  } = useChatDock();

  const [incoming, setIncoming] = useState<Record<number, IncomingOffer>>({});

  const stashIncoming = async (offer: IncomingOffer) => {
    // Prefer creating/opening the conversation window by conversationId if possible.
    if (ensureWindowForConversation) {
      await ensureWindowForConversation(offer.conversationId, offer.fromUserId);
    } else if (openChatWith) {
      // Fallback: open a window with that user (the window usually binds to existing conversation)
      await openChatWith(offer.fromUserId);
    } else if (openWindowForUser) {
      await openWindowForUser(offer.fromUserId);
    } else if (openConversation) {
      // If this requires a peer param in your app, openChatWith above should have handled it.
      openConversation(offer.conversationId as any, undefined as any);
    }

    // Buffer the offer; the correct ChatWindow will consume it immediately on mount.
    setIncoming((m) => ({ ...m, [offer.conversationId]: offer }));
  };

  const consumeIncoming = (cid: number) =>
    setIncoming((m) => {
      const { [cid]: _, ...rest } = m;
      return rest;
    });

  return (
    <>
      {/* Always present so no offer is ever missed */}
      <CallOfferBridge stashIncoming={stashIncoming} />

      {/* Dock shows only when we actually have windows */}
      {windows?.length > 0 && (
        <div className="fixed bottom-2 right-2 z-[90] flex gap-2 overflow-x-auto max-w-full pr-2">
          {windows.map((w: any) => (
            <ChatWindow
              key={w.conversationId}
              item={w}
              incomingOffer={incoming[w.conversationId]}
              onConsumeIncoming={consumeIncoming}
            />
          ))}
        </div>
      )}
    </>
  );
}
