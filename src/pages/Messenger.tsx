// src/pages/Messenger.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader,useAuthHeaderupload } from '@/hooks/useAuthHeader';
import {
  fetchConversations, fetchMessages, sendMessage, markSeen, setTyping,
  openConversationWith, searchPeopleForChat
} from '@/services/messengerService';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Image as ImageIcon, Mic, Send, Plus } from 'lucide-react';
import { stripUploads } from '@/lib/url';
import NewChatModal from '@/components/messenger/NewChatModal';
import { connectSocket } from '@/services/socketClient';
import { useChatDock } from "@/contexts/ChatDockContext";



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

type Conversation = {
  conversationId: number;
  peer: { id: number; username: string; fullName: string; avatar?: string|null };
  lastMessage: string;
  lastTime: string | null;
  unread: boolean;
  typing: boolean;
};
type Message = { id: number; authorId: number; text: string; image: string|null; voice: string|null; time: string };

export default function Messenger() {
  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headers1 = useAuthHeaderupload(accessToken);
  const headersRef = useRef(headers);
  const headers1Ref = useRef(headers1);
  useEffect(() => { headersRef.current = headers; headers1Ref.current = headers1;  }, [headers,headers1]);

  const [searchParams] = useSearchParams();
  const startUserId = useMemo(() => {
    const v = searchParams.get('user');
    return v ? Number(v) : null;
  }, [searchParams]);

  const { openConversation } = useChatDock();


  const [convs, setConvs] = useState<Conversation[] | null>(null);
  const [convLoading, setConvLoading] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  // messages
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // composer
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [voice, setVoice] = useState<File | null>(null);
  const inFlightRef = useRef(false);

  // NEW CHAT modal
  const [newOpen, setNewOpen] = useState(false);

  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);


  // load conversations once
  useEffect(() => {
    if (!accessToken) return;
    if (convLoading || convs) return;
    setConvLoading(true);
    fetchConversations(headersRef.current)
      .then(setConvs)
      .catch(console.error)
      .finally(() => setConvLoading(false));
  }, [accessToken, convs, convLoading]);

  // deep-link: /messages?user=123 -> open/create conversation automatically
  useEffect(() => {
    if (!accessToken) return;
    if (!startUserId) return;

    (async () => {
      try {
        const { conversationId } = await openConversationWith(startUserId, headersRef.current);
        // Refresh list if empty
        if (!convs) {
          const list = await fetchConversations(headersRef.current);
          setConvs(list);
        }
        setActiveId(conversationId);
      } catch (e) {
        console.error('[open from query]', e);
      }
    })();
  }, [accessToken, startUserId]); // intentionally not depending on convs to avoid loops

  // load first messages when opening a conversation
  useEffect(() => {
    if (!accessToken || !activeId) return;
    setMsgs(null);
    setCursor(null);
    setDone(false);
    Promise.resolve().then(() => loadMore(true));
  }, [accessToken, activeId]);

  useEffect(() => {
    if (!accessToken) return;
    const s = connectSocket(accessToken);
    socketRef.current = s;
  
    // 1) incoming new message
    s.on('message:new', ({ message }: { message: Message & { conversationId: number } }) => {
      // If the active chat is this conversation, append in real time
      if (activeId && message.conversationId === activeId) {
        // Ignore if it's my own echo (server emits only to peers, but guard anyway)
        if (message.authorId !== user?.id) {
          setMsgs(prev => (prev ? [...prev, message] : [message]));
        }
      }
      // Update/bump conversation list
      setConvs(prev => {
        if (!prev) return prev;
        const preview = message.text || (message.image ? '[image]' : message.voice ? '[voice]' : '');
        const exists = prev.some(c => c.conversationId === message.conversationId);
        if (!exists) {
          // If the conversation isn't present yet, refresh the list lazily (optional) or append a stub
          return prev; // keep it simple; user will see it after next refresh
        }
        return prev.map(c => c.conversationId === message.conversationId
          ? { ...c, lastMessage: preview, lastTime: message.time, unread: c.conversationId === activeId ? false : true }
          : c
        );
      });
    });
  
    // 2) typing indicator
    s.on('message:typing', (p: { conversationId: number; userId: number; typing: boolean }) => {
      if (p.userId === user?.id) return;
      setConvs(prev => prev?.map(c =>
        c.conversationId === p.conversationId ? { ...c, typing: p.typing } : c
      ) || null);
    });
  
    // 3) seen
    s.on('message:seen', (p: { conversationId: number; userId: number }) => {
      // Optionally mark read state; for simplicity just clear unread if I'm the sender and it's the peer
      if (p.userId !== user?.id) return;
      setConvs(prev => prev?.map(c =>
        c.conversationId === p.conversationId ? { ...c, unread: false } : c
      ) || null);
    });
  
    // 4) conversation list bump
    s.on('conversation:update', (p: { conversationId: number; lastMessage: string; lastTime: string }) => {
      setConvs(prev => {
        if (!prev) return prev;
        const exists = prev.find(c => c.conversationId === p.conversationId);
        if (!exists) return prev;
        return prev.map(c =>
          c.conversationId === p.conversationId
            ? { ...c, lastMessage: p.lastMessage, lastTime: p.lastTime }
            : c
        );
      });
    });
  
    return () => { s.close(); };
  }, [accessToken, activeId, user?.id]);

  useEffect(() => {
    if (!activeId) return;
    const t = setTimeout(() => {
      setTyping(activeId, false, headersRef.current).catch(() => {});
    }, 1000); // 1s idle = stop typing
    return () => clearTimeout(t);
  }, [text, activeId]);

  const loadMore = async (reset = false) => {
    if (!activeId || !accessToken) return;
    if (inFlightRef.current) return;
    if (!reset && done) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const { items = [], nextCursor } = await fetchMessages(
        activeId,
        { cursor: reset ? null : cursor, limit: 25 },
        headersRef.current
      );
      setMsgs(prev => (prev ? [...items, ...prev] : items)); // prepend older
      setCursor(nextCursor ?? null);
      if (!nextCursor || items.length === 0) setDone(true);

      if (reset) {
        await markSeen(activeId, headersRef.current);
        setConvs(prev => prev?.map(c => c.conversationId === activeId ? { ...c, unread: false } : c) || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  const onSend = async () => {
    console.log(headers1Ref.current,'headers1Ref.currentheaders1Ref.current')
    if (!activeId || (!text && !image && !voice)) return;
    try {
      const newMsg = await sendMessage(activeId, { text, image, voice }, headers1Ref.current);
      setMsgs(prev => (prev ? [...prev, { ...newMsg }] : [{ ...newMsg }]));
      setText(''); setImage(null); setVoice(null);
      setConvs(prev => {
        if (!prev) return prev;
        return prev.map(c => c.conversationId === activeId
          ? { ...c, lastMessage: newMsg.text || (newMsg.image ? '[image]' : newMsg.voice ? '[voice]' : ''), lastTime: newMsg.time }
          : c
        );
      });
    } catch (e) {
      console.error(e);
    }
  };

  // NEW: open modal + create/open conversation from pick
  const openNewFromPick = async (person: { id:number; fullName:string; username:string }) => {
    try {
      const { conversationId } = await openConversationWith(person.id, headersRef.current);
      // refresh list if needed
      if (!convs) {
        const list = await fetchConversations(headersRef.current);
        setConvs(list);
      }
      setActiveId(conversationId);
      setNewOpen(false);
    } catch (e) {
      console.error('[open from pick]', e);
    }
  };

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />
      <div className="max-w-6xl mx-auto px-2 sm:px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: conversations */}
        {/* <div className="bg-white rounded-lg shadow p-3 md:col-span-1 overflow-y"> */}
        <div className="bg-white rounded-lg shadow p-3 md:col-span-1 flex flex-col h-[70vh]">
            
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold">Messages</div>
            <Button size="sm" variant="secondary" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
          {convLoading && <div className="text-sm text-gray-500"><Loader2 className="inline h-4 w-4 animate-spin" /> Loading…</div>}
          {Array.isArray(convs) && convs.length === 0 && (
            <div className="text-sm text-gray-500">
              No conversations yet. Click <span className="font-medium">New</span> to start one.
            </div>
          )}
          <div className="flex-1 overflow-y-auto overscroll-contain pr-1">
          <div className="space-y-1">
            {Array.isArray(convs) && convs.map(c => (
              // <button
              //   key={c.conversationId}
              //   onClick={() => setActiveId(c.conversationId)}
              //   className={`w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 ${activeId===c.conversationId?'bg-gray-50':''}`}
              // >
              <button
                key={c.conversationId}
                onClick={() => openConversation(c.conversationId, c.peer)}   // <— open floating chat
                className={`w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 ${activeId===c.conversationId?'bg-gray-50':''}`}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={c.peer.avatar ? API_BASE_URL + '/uploads/' + stripUploads(c.peer.avatar) : ''} />
                  <AvatarFallback>{(c.peer.fullName || c.peer.username).slice(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate">{c.peer.fullName || c.peer.username}</div>
                    {c.unread && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-[#1877F2]" />}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{c.typing ? 'typing…' : c.lastMessage}</div>
                </div>
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Right: chat */}
        {/* <div className="bg-white rounded-lg shadow md:col-span-2 flex flex-col h-[70vh]">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation or click <span className="font-medium mx-1">New</span> to start one
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-3 pt-3">
                <div className="flex justify-center mb-2">
                  {!done && (
                    <Button size="sm" variant="secondary" disabled={loading} onClick={() => loadMore(false)}>
                      {loading ? 'Loading…' : 'Load older'}
                    </Button>
                  )}
                </div>

                {msgs?.map(m => {
                  const mine = m.authorId === user?.id;
                  return (
                    <div key={m.id} className={`mb-2 flex ${mine?'justify-end':'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine ? 'bg-[#1877F2] text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}
                        {m.image && (
                          <img
                            src={API_BASE_URL + '/uploads/' + stripUploads(m.image)}
                            className="rounded mt-1 max-h-64 object-cover"
                          />
                        )}
                        {m.voice && (
                          <audio controls className="mt-1">
                            <source src={API_BASE_URL + '/uploads/' + stripUploads(m.voice)} />
                          </audio>
                        )}
                        <div className={`text-[10px] mt-1 ${mine ? 'text-white/80' : 'text-gray-500'}`}>{new Date(m.time).toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t flex items-center gap-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                  <ImageIcon className="h-5 w-5 text-gray-600" />
                </label>
                <label className="cursor-pointer">
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => setVoice(e.target.files?.[0] || null)} />
                  <Mic className="h-5 w-5 text-gray-600" />
                </label>
                <Input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (activeId) setTyping(activeId, true, headersRef.current).catch(() => {});
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
        </div> */}
      </div>

      {/* New chat modal */}
      <NewChatModal
        open={newOpen}
        onOpenChange={setNewOpen}
        search={(q) => searchPeopleForChat(q, headersRef.current)}
        onPick={openNewFromPick}
      />
    </div>
  );
}
