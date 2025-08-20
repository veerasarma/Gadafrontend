import { Story } from '@/services/storyService';
import { useEffect, useRef, useState, useCallback } from 'react';
import { stripUploads } from '@/lib/url';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

interface Props { group: Story; onClose: () => void; }

const IMAGE_MS = 6000;          // default image duration
const VIDEO_FALLBACK_MS = 10000; // fallback until metadata loads

export function StoryViewer({ group, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [activeProgress, setActiveProgress] = useState(0); // 0..100 for current segment
  const [videoMs, setVideoMs] = useState<number | null>(null); // current video duration
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const total = group.stories.length;
  const story = group.stories[idx];
  const isVideo = story.type === 'video';
  const currentDuration =
    isVideo ? (videoMs ?? VIDEO_FALLBACK_MS) : IMAGE_MS;

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
      onClose();
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
      // at first story, treat as close or just reset
      setActiveProgress(0);
    }
  }, [idx]);

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
    // Re-run when idx changes or duration source changes (e.g., metadata loaded)
  }, [idx, currentDuration, goNext]);

  // When a video ends sooner/later than expected, move on immediately
  const handleVideoEnded = () => goNext();

  // When video metadata loads, use the real duration (cap very short/long edge cases if desired)
  const handleLoadedMetadata = () => {
    if (videoRef.current?.duration && isFinite(videoRef.current.duration)) {
      const ms = Math.max(1000, Math.floor(videoRef.current.duration * 1000)); // min 1s
      setVideoMs(ms);
      // restart progress from this moment
      startRef.current = null;
    }
  };

  // Keyboard arrows for convenience (optional)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  // Compute segment bar states
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
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {segments.map((pct, i) => (
            <div key={i} className="h-1.5 w-full bg-white/30 rounded overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: `${pct}%`, transition: pct === 0 || pct === 100 ? 'width 0.2s linear' : 'none' }}
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

          {/* Close button */}
          <button
            className="absolute top-2 right-2 text-white/90 hover:text-white text-xl leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>

          {/* Click/tap zones: prev/next */}
          <button
            className="absolute inset-y-0 left-0 w-1/3 cursor-pointer bg-transparent"
            onClick={goPrev}
            aria-label="Previous"
          />
          <button
            className="absolute inset-y-0 right-0 w-1/3 cursor-pointer bg-transparent"
            onClick={goNext}
            aria-label="Next"
          />
        </div>
      </div>
    </div>
  );
}
