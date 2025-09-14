// src/components/stories/StoryViewer.tsx
import { Story } from '@/services/storyService';
import { useEffect, useRef, useState, useMemo } from 'react';
import { stripUploads } from '@/lib/url';
import { X, ChevronLeft, ChevronRight, Trash2, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { useChatDock } from '@/contexts/ChatDockContext';
import {
  trackStoryView,
  fetchStoryViewers,
  deleteStory,
} from '@/services/storyService';
import { sendStoryReply } from '@/services/messengerService';
import { toast } from 'sonner';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';
const IMAGE_MS = 6000;

interface Props {
  group: Story;
  initialIndex?: number;
  onClose: (reason: 'finished' | 'user' | 'prevGroup' | 'deleted') => void;
  onDeleted?: (id: number) => void;
}

export default function StoryViewer({
  group, initialIndex = 0, onClose, onDeleted,
}: Props) {
  const { user, accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const { openChatWith } = useChatDock();

  const [replyText, setReplyText] = useState('');
  const [replyEmojiCode, setReplyEmojiCode] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);       // NEW

  const myId = (user as any)?.id ?? (user as any)?._id;
  const isMine = Number(group.userId) === Number(myId);

  const [idx, setIdx] = useState(initialIndex);
  const item = group.stories[idx];
  const total = group.stories.length;

  /** ---------- robust meta parsing for TEXT stories ---------- */
  const parsedMeta = useMemo(() => {
    const raw = (item as any)?.meta?.caption ?? (item as any)?.meta;
    if (!raw) return {};
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    return raw;
  }, [item]);

  const isText = item.type === 'text' || (!item.url && parsedMeta?.text);

  const mediaUrl = useMemo(() => {
    if (isText) return '';
    if (!item?.url) return '';
    if (/^https?:\/\//i.test(item.url)) return item.url;
    if (item.url.startsWith('/uploads/')) return API_BASE_URL + item.url;
    return API_BASE_URL + '/uploads/' + stripUploads(item.url);
  }, [item, isText]);

  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const lastPctRef = useRef(0);                                   // NEW – remember pct when paused

  const [vLoading, setVLoading] = useState(true);
  const [viewers, setViewers] = useState<any[]>([]);
  const [viewCount, setViewCount] = useState<number>(0);
  const didViewRef = useRef(false);

  // VIDEO refs/duration
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const durationMsRef = useRef<number>(IMAGE_MS);

  // PAUSE when typing/sending
  const paused = !isMine && (inputFocused || sending);            // NEW

  // TEXT visuals
  const textBg = parsedMeta?.bg || '#111111';
  const textColor = parsedMeta?.color || '#ffffff';
  const textContent: string =
    (parsedMeta?.text ?? parsedMeta?.caption ?? '').toString();

  // Preload
  useEffect(() => {
    setReady(false);
    setProgress(0);
    startRef.current = null;
    lastPctRef.current = 0;

    if (isText) {
      durationMsRef.current = IMAGE_MS;
      setReady(true);
      return;
    }
    if (item.type === 'image') {
      durationMsRef.current = IMAGE_MS;
      const img = new Image();
      img.src = mediaUrl;
      img.onload = () => setReady(true);
      img.onerror = () => setReady(true);
    } else {
      // video – duration set on loadedmetadata
      setReady(true);
    }
  }, [idx, mediaUrl, isText, item.type]);

  // Master ticker (image/text OR video)
  useEffect(() => {
    if (!ready) return;

    const runTick = (now: number) => {
      // paused? keep progress static and don't schedule goNext
      if (paused) {
        rafRef.current = requestAnimationFrame(runTick);
        return;
      }

      // establish start time based on current pct so resume continues correctly
      const duration = durationMsRef.current || IMAGE_MS;
      if (startRef.current == null) {
        const already = lastPctRef.current; // 0..100
        const consumed = (already / 100) * duration;
        startRef.current = now - consumed;
      }

      const pct = Math.min(100, ((now - startRef.current) / duration) * 100);
      lastPctRef.current = pct;
      setProgress(pct);

      if (pct >= 100) {
        // for video, also guard against onended firing separately
        return goNext();
      }
      rafRef.current = requestAnimationFrame(runTick);
    };

    cancelAnimationFrame(rafRef.current || 0);
    rafRef.current = requestAnimationFrame(runTick);
    return () => cancelAnimationFrame(rafRef.current || 0);
  }, [ready, idx, paused]);

  // Pause/play actual <video> element when paused toggles
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) {
      try { v.pause(); } catch {}
    } else {
      try { v.play(); } catch {}
    }
  }, [paused]);

  function goNext() {
    cancelAnimationFrame(rafRef.current || 0);
    lastPctRef.current = 0;
    if (idx < total - 1) setIdx((i) => i + 1);
    else onClose('finished');
  }
  function goPrev() {
    cancelAnimationFrame(rafRef.current || 0);
    lastPctRef.current = 0;
    if (idx > 0) setIdx((i) => i - 1);
    else onClose('prevGroup');
  }

  // Track views
  useEffect(() => {
    didViewRef.current = false;
    setVLoading(true);
    setViewers([]);
    setViewCount(0);

    (async () => {
      try {
        if (!didViewRef.current) {
          await trackStoryView(item.id, headers);
          didViewRef.current = true;
        }
        const res = await fetchStoryViewers(item.id, 0, 36, headers);
        setViewers(res.items || []);
        setViewCount(res.count || (res.items?.length ?? 0));
      } finally {
        setVLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, item.id]);

  async function sendPayload(code: number | null) {
    setSending(true);
    try {
      await sendStoryReply(
        {
          storyId: Number(item.id),
          toUserId: Number(group.userId),
          text: replyText.trim() || null,
          emojiCode: code,
          previewUrl: !isText ? mediaUrl : null,
        },
        headers
      );
      // Keep the viewer open until user decides; also open chat dock
      openChatWith?.(Number(group.userId));
      setReplyText('');
      setReplyEmojiCode(null);
      // do NOT auto-close; let user close manually
    } catch (e) {
      console.error(e);
      toast.error('Failed to send reply.');
    } finally {
      setSending(false);
    }
  }
  function onEmojiClick(code: number) {
    // tapping a quick reaction should also pause during request
    void sendPayload(code);
  }
  async function onClickSend() {
    if (!replyText.trim() && !replyEmojiCode) return;
    await sendPayload(replyEmojiCode);
  }

  async function handleDelete() {
    if (!confirm('Delete this story?')) return;
    try {
      const r = await deleteStory(item.id, headers);
      if (r?.ok) { onDeleted?.(item.id); onClose('deleted'); toast.success('Story has been deleted successfully'); }
    } catch {
      toast.error('Failed to delete story');
    }
  }

  const segments = group.stories.map((_, i) =>
    i < idx ? 100 : i === idx ? progress : 0
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="relative w-full max-w-3xl">
        {/* progress */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-30">
          {segments.map((pct, i) => (
            <div key={i} className="h-1.5 w-full bg-white/30 rounded overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${pct}%` }} />
            </div>
          ))}
        </div>

        {/* media */}
        <div className="relative rounded overflow-hidden bg-black">
          {isText ? (
            <div
              className="w-full flex items-center justify-center"
              style={{
                background: textBg,
                aspectRatio: '9 / 16',
                maxHeight: '70vh',
                margin: '0 auto',
              }}
            >
              <div
                className="px-6 text-center font-semibold"
                style={{
                  color: textColor,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.25,
                  fontSize: 'clamp(18px, 3.5vw, 42px)',
                }}
              >
                {textContent || ''}
              </div>
            </div>
          ) : item.type === 'image' ? (
            <img src={mediaUrl} alt="" className="w-full max-h-[70vh] object-contain" />
          ) : (
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el) {
                  el.onloadedmetadata = () => {
                    setReady(true);
                    durationMsRef.current = Math.max(1000, (el.duration || 0) * 1000);
                    // reset timers for accurate resume
                    startRef.current = null;
                    lastPctRef.current = 0;
                  };
                  el.onended = () => { if (!paused) goNext(); };
                  // ensure autoplay honors pause
                  if (paused) { try { el.pause(); } catch {} } else { try { el.play(); } catch {} }
                }
              }}
              src={mediaUrl}
              className="w-full max-h-[70vh] object-contain"
              autoPlay
              playsInline
              controls={false}
            />
          )}

          {/* Overlays */}
          {!!item.meta?.overlays?.length && ready && (
            <div className="pointer-events-none absolute inset-0 z-20">
              {item.meta.overlays.map((o: any) => (
                <div
                  key={o.id}
                  className="absolute select-none"
                  style={{
                    left: `${o.xPct}%`,
                    top: `${o.yPct}%`,
                    transform: `translate(-50%, -50%) rotate(${o.rotateDeg ?? 0}deg)`,
                    fontSize: (o.fontSize ?? 22) + 'px',
                    color: o.color ?? '#fff',
                    fontWeight: (o.weight ?? 600) as any,
                    textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    whiteSpace: 'pre-wrap',
                    textAlign: 'center',
                  }}
                >
                  {o.text}
                </div>
              ))}
            </div>
          )}

          {/* Caption */}
          {item.meta?.caption && ready && !isText && (
            <div className="absolute bottom-3 left-3 right-3 z-20">
              <div className="bg-black/50 text-white rounded px-3 py-2 text-sm">{item.meta.caption}</div>
            </div>
          )}

          {/* header controls */}
          <button
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-[120] pointer-events-auto"
            onClick={() => onClose('user')}
            aria-label="Close story"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pr-10 z-30">
            <button className="bg-black/40 hover:bg-black/60 text-white rounded-full p-2" onClick={goPrev}>
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pl-10 z-30">
            <button className="bg-black/40 hover:bg-black/60 text-white rounded-full p-2" onClick={goNext}>
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* footer */}
        <div className="mt-3">
          {isMine ? (
            <div className="rounded-xl bg-white p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <div className="font-semibold">Viewers</div>
                <div className="ml-auto text-xs text-gray-500">{viewCount}</div>
              </div>
              <div className="mt-2 min-h-[40px]">
                {vLoading ? (
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </div>
                ) : viewCount === 0 ? (
                  <div className="text-sm text-gray-500">No viewers yet</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {viewers.map((v) => (
                      <span key={v.user_id ?? v.id} className="px-2 py-1 rounded-full bg-gray-100 text-xs">
                        {v.user_name ?? v.username ?? 'User'}
                      </span>
                    ))}
                    {viewCount > viewers.length && (
                      <span className="px-2 py-1 rounded-full bg-gray-50 text-xs text-gray-600">
                        +{viewCount - viewers.length} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 text-right">
                <button
                  className="inline-flex items-center gap-2 rounded border px-3 py-2 text-red-600 hover:bg-red-50"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" /> Delete story
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-3 shadow">
              <div
                className="flex items-center gap-2 border rounded-full px-3 py-2"
              >
                <input
                  type="text"
                  placeholder="Reply…"
                  className="flex-1 outline-none text-sm"
                  value={replyText}
                  onFocus={() => setInputFocused(true)}     // NEW
                  onBlur={() => setInputFocused(false)}      // NEW
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button
                  className="ml-1 rounded-full bg-[#1877F2] text-white px-3 py-1.5 text-sm hover:bg-[#1865d6] disabled:opacity-50"
                  onClick={onClickSend}
                  disabled={sending || (!replyText.trim() && !replyEmojiCode)}
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>

              <div className="mt-2 flex justify-around text-2xl">
                {[{code:1,char:'👍'},{code:2,char:'❤️'},{code:3,char:'😆'},{code:4,char:'😲'},{code:5,char:'😢'},{code:6,char:'😡'}].map(e => (
                  <button
                    key={e.code}
                    className={`transition hover:scale-110 ${replyEmojiCode===e.code ? 'ring-2 ring-blue-500 rounded-full' : ''}`}
                    onClick={() => onEmojiClick(e.code)}
                    title="Quick reaction"
                  >
                    {e.char}
                  </button>
                ))}
              </div>
              {/* Small hint */}
              <div className="mt-1 text-[11px] text-gray-500 text-center">
                Typing pauses the story. Close when you’re done.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
