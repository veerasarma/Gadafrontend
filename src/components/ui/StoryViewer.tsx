// StoryViewer.tsx (DROP-IN REPLACEMENT: fast preloading + LQIP)
import { Story } from '@/services/storyService';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { stripUploads } from '@/lib/url';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

interface Props {
  group: Story;
  initialIndex?: number;
  onClose: (reason: 'finished' | 'user' | 'prevGroup') => void;
}

const IMAGE_MS = 6000;
const VIDEO_FALLBACK_MS = 10000;

// ——— Types used in meta ———
type OverlayItem = {
  id: string;
  type: 'text' | 'emoji';
  text: string;
  xPct: number;
  yPct: number;
  fontSize?: number;
  color?: string;
  rotateDeg?: number;
  weight?: number;
};

type StoryMeta = {
  caption?: string;
  overlays?: OverlayItem[];
  musicUrl?: string;
  musicVolume?: number;
  /** Optional tiny preview: data:image/jpeg;base64,... or small URL */
  blurDataURL?: string;
};

export function StoryViewer({ group, onClose, initialIndex = 0 }: Props) {
  const [idx, setIdx] = useState(initialIndex);
  const total = group.stories.length;
  const story = group.stories[idx];

  const meta: StoryMeta = useMemo(() => {
    return (story as any)?.meta || (story as any)?.metadata || (story as any)?.extras || {};
  }, [story]);

  const isVideo = story.type === 'video';
  const mediaUrl = API_BASE_URL + '/uploads/' + stripUploads(story.url);

  // —— NEW: readiness state (avoid white flash) ——
  const [ready, setReady] = useState(false);
  const [activeProgress, setActiveProgress] = useState(0);
  const [videoMs, setVideoMs] = useState<number | null>(null);
  const currentDuration = isVideo ? (videoMs ?? VIDEO_FALLBACK_MS) : IMAGE_MS;

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // —— PRELOAD current, then show; also warm next/prev ——
  useEffect(() => {
    let cancelled = false;
    setReady(false);

    async function loadCurrent() {
      if (isVideo) {
        // Wait for metadata / loadeddata before showing
        // We'll set ready in onLoadedData handler for exact timing.
        if (videoRef.current && videoRef.current.readyState >= 2) {
          setReady(true);
        } else {
          setReady(false);
        }
      } else {
        const img = new Image();
        img.decoding = 'async';
        // Hint: prioritize current image
        (img as any).fetchPriority = 'high';
        img.src = mediaUrl;
        try {
          await img.decode();
        } catch {
          // decode can reject for cross-origin or cached cases; fallback to onload
          await new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          });
        }
        if (!cancelled) setReady(true);
      }
    }

    function warm(url: string | null) {
      if (!url) return;
      const img = new Image();
      (img as any).fetchPriority = 'low';
      img.loading = 'eager';
      img.src = url;
    }

    loadCurrent();

    // Warm neighbors
    const next = idx + 1 < total ? API_BASE_URL + '/uploads/' + stripUploads(group.stories[idx + 1].url) : null;
    const prev = idx - 1 >= 0 ? API_BASE_URL + '/uploads/' + stripUploads(group.stories[idx - 1].url) : null;
    if (next && group.stories[idx + 1].type === 'image') warm(next);
    if (prev && group.stories[idx - 1].type === 'image') warm(prev);

    // Reset progress timer
    setActiveProgress(0);
    setVideoMs(null);
    startRef.current = null;

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, mediaUrl, isVideo, total]);

  // —— Progress animation (only when visible & ready) ——
  const cleanupRAF = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const goNext = useCallback(() => {
    cleanupRAF();
    if (idx < total - 1) {
      setIdx((i) => i + 1);
      return;
    }
    onClose('finished');
  }, [idx, total, onClose]);

  const goPrev = useCallback(() => {
    cleanupRAF();
    if (idx > 0) {
      setIdx((i) => i - 1);
      return;
    }
    onClose('prevGroup');
  }, [idx, onClose]);

  useEffect(() => {
    cleanupRAF();
    setActiveProgress(0);
    if (!ready) return;

    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const elapsed = now - startRef.current;
      const pct = Math.min(100, (elapsed / currentDuration) * 100);
      setActiveProgress(pct);
      if (pct >= 100) {
        goNext();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cleanupRAF();
  }, [ready, currentDuration, goNext]);

  // Video events
  const onLoadedMetadata = () => {
    if (videoRef.current?.duration && isFinite(videoRef.current.duration)) {
      const ms = Math.max(1000, Math.floor(videoRef.current.duration * 1000));
      setVideoMs(ms);
    }
  };
  const onLoadedData = () => {
    setReady(true);
  };
  const onEnded = () => goNext();

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose('user');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  // Segments
  const segments = group.stories.map((_, i) => (i < idx ? 100 : i === idx ? activeProgress : 0));

  // Music
  useEffect(() => {
    if (!audioRef.current || !meta?.musicUrl) return;
    audioRef.current.volume = Math.min(1, Math.max(0, meta.musicVolume ?? 0.8));
    audioRef.current.play().catch(() => {});
    return () => {
      try { audioRef.current?.pause(); } catch {}
    };
  }, [idx, meta?.musicUrl, meta?.musicVolume]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="relative w-full max-w-lg">

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-30">
          {segments.map((pct, i) => (
            <div key={i} className="h-1.5 w-full bg-white/30 rounded overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${pct}%`, transition: pct === 0 || pct === 100 ? 'width 0.2s linear' : 'none' }} />
            </div>
          ))}
        </div>

        {/* Media Frame */}
        <div className="relative rounded overflow-hidden">
          {/* LQIP/Skeleton layer (shows until ready) */}
          {!ready && (
            <div
              className="w-full max-h-[80vh] rounded bg-[#111] flex items-center justify-center"
              style={
                meta?.blurDataURL
                  ? {
                      backgroundImage: `url("${meta.blurDataURL}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'blur(12px)',
                    }
                  : {}
              }
            >
              {!meta?.blurDataURL && (
                <div className="w-2/3 h-3/4 bg-white/10 animate-pulse rounded" />
              )}
            </div>
          )}

          {/* Image / Video (only reveal when ready) */}
          {story.type === 'image' ? (
            <img
              src={mediaUrl}
              className={`w-full max-h-[80vh] object-contain rounded transition-opacity duration-150 ${ready ? 'opacity-100' : 'opacity-0'}`}
              alt=""
              draggable={false}
              loading="eager"
              fetchpriority="high"
              onLoad={() => setReady(true)} // fallback if decode path missed
            />
          ) : (
            <video
              ref={videoRef}
              src={mediaUrl}
              className={`w-full max-h-[80vh] object-contain rounded transition-opacity duration-150 ${ready ? 'opacity-100' : 'opacity-0'}`}
              autoPlay
              playsInline
              preload="metadata"
              onLoadedMetadata={onLoadedMetadata}
              onLoadedData={onLoadedData}
              onEnded={onEnded}
            />
          )}

          {/* Overlays */}
          {!!meta?.overlays?.length && ready && (
            <div className="pointer-events-none absolute inset-0 z-20">
              {meta.overlays.map((o) => (
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
          {meta?.caption && ready && (
            <div className="absolute bottom-3 left-3 right-3 z-20">
              <div className="bg-black/50 text-white rounded px-3 py-2 text-sm">{meta.caption}</div>
            </div>
          )}

          {/* Close / Nav */}
          <button
            className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white p-2 transition z-40"
            onClick={(e) => { e.stopPropagation(); onClose('user'); }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pr-10 z-30">
            <button className="inline-flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white p-2 transition" onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Previous">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pl-10 z-30">
            <button className="inline-flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white p-2 transition" onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Next">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Tap zones */}
          <button className="absolute inset-y-0 left-0 w-1/3 cursor-pointer bg-transparent z-20" onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Previous zone" />
          <button className="absolute inset-y-0 right-0 w-1/3 cursor-pointer bg-transparent z-20" onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Next zone" />
        </div>

        {/* Hidden music player (auto/loop) */}
        {meta?.musicUrl && <audio ref={audioRef} src={meta.musicUrl} autoPlay loop />}
      </div>
    </div>
  );
}
