import { Story } from '@/services/storyService';
import { useEffect, useRef, useState, useCallback } from 'react';
import { stripUploads } from '@/lib/url';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

interface Props {
  group: Story;
  initialIndex?: number; // NEW: allow parent to start at a specific slide
  onClose: (reason: 'finished' | 'user' | 'prevGroup') => void;
}

const IMAGE_MS = 6000;           // default per-image duration
const VIDEO_FALLBACK_MS = 10000; // until real metadata loads

export function StoryViewer({ group, onClose, initialIndex = 0 }: Props) {
  const [idx, setIdx] = useState(initialIndex);
  const [activeProgress, setActiveProgress] = useState(0); // 0..100 for current segment
  const [videoMs, setVideoMs] = useState<number | null>(null); // current video duration
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const total = group.stories.length;
  const story = group.stories[idx];
  const isVideo = story.type === 'video';
  const currentDuration = isVideo ? (videoMs ?? VIDEO_FALLBACK_MS) : IMAGE_MS;

  // Reset state whenever group OR requested starting index changes
  useEffect(() => {
    setIdx(Math.max(0, Math.min(initialIndex, total - 1)));
    setActiveProgress(0);
    setVideoMs(null);
    startRef.current = null;
  }, [group, initialIndex, total]);

  const cleanupRAF = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const goNext = useCallback(() => {
    cleanupRAF();
    if (idx < total - 1) {
      setIdx(i => i + 1);
      setActiveProgress(0);
      setVideoMs(null);
      startRef.current = null;
    } else {
      onClose('finished'); // finished this user's group -> chain in parent
    }
  }, [idx, total, onClose]);

  const goPrev = useCallback(() => {
    cleanupRAF();
    if (idx > 0) {
      setIdx(i => i - 1);
      setActiveProgress(0);
      setVideoMs(null);
      startRef.current = null;
    } else {
      // first item of this group → ask parent to open previous user at their last item
      onClose('prevGroup');
    }
  }, [idx, onClose]);

  // Progress animation via rAF
  useEffect(() => {
    cleanupRAF();
    setActiveProgress(0);

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
  }, [idx, currentDuration, goNext]);

  // When a video ends sooner/later than expected, move on immediately
  const handleVideoEnded = () => goNext();

  // When video metadata loads, use the real duration
  const handleLoadedMetadata = () => {
    if (videoRef.current?.duration && isFinite(videoRef.current.duration)) {
      const ms = Math.max(1000, Math.floor(videoRef.current.duration * 1000)); // min 1s
      setVideoMs(ms);
      startRef.current = null; // restart progress with exact duration
    }
  };

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose('user'); // user-initiated close
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  // Segment bar states
  const segments = group.stories.map((_, i) => {
    if (i < idx) return 100;
    if (i === idx) return activeProgress;
    return 0;
  });

  const mediaUrl = API_BASE_URL + '/uploads/' + stripUploads(story.url);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="relative w-full max-w-lg">

        {/* Top progress segments */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-30">
          {segments.map((pct, i) => (
            <div key={i} className="h-1.5 w-full bg-white/30 rounded overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: `${pct}%`,
                  transition: pct === 0 || pct === 100 ? 'width 0.2s linear' : 'none'
                }}
              />
            </div>
          ))}
        </div>

        {/* Media */}
        <div className="relative">
          {story.type === 'image' ? (
            <img
              src={mediaUrl}
              className="w-full max-h-[80vh] object-contain rounded"
              alt=""
              draggable={false}
            />
          ) : (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full max-h-[80vh] object-contain rounded"
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnded}
              onLoadedMetadata={handleLoadedMetadata}
            />
          )}

          {/* Close button (above tap zones) */}
          <button
            className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white p-2 transition z-40"
            onClick={(e) => { e.stopPropagation(); onClose('user'); }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Visible Prev / Next chevrons */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pr-10 z-30">
            <button
              className="inline-flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white p-2 transition"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pl-10 z-30">
            <button
              className="inline-flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white p-2 transition"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Large tap zones for mobile (below buttons via z-20) */}
          <button
            className="absolute inset-y-0 left-0 w-1/3 cursor-pointer bg-transparent z-20"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous zone"
          />
          <button
            className="absolute inset-y-0 right-0 w-1/3 cursor-pointer bg-transparent z-20"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next zone"
          />
        </div>
      </div>
    </div>
  );
}
