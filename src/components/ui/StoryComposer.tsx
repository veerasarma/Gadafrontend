// StoryComposer.tsx (DROP-IN REPLACEMENT)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Music, Type, Smile, Trash2, Check, ChevronDown, ChevronUp, Play, Square } from "lucide-react";

export type OverlayItem = {
  id: string;
  type: "text" | "emoji";
  text: string;
  xPct: number;   // 0..100
  yPct: number;   // 0..100
  fontSize?: number;
  color?: string;
  rotateDeg?: number;
  weight?: number; // 400/600/700
};

export type StoryMeta = {
  caption?: string;
  overlays?: OverlayItem[];
  musicUrl?: string;
  musicVolume?: number; // 0..1
};

type Props = {
  file: File;
  onCancel: () => void;
  onPublish: (meta: StoryMeta) => void;
};

// ---- NEW: Emoji palette (add more as you like) ----
const EMOJI_PALETTE = [
  "😀","😃","😄","😁","😆","🥹","😊","🙂","😉","😍","😘","😜","🤩","🥳","🤗","😎",
  "😇","🤔","🤨","😐","😴","🥱","😪","😮","😯","😲","😳","🥵","🥶","😱","😭","😅",
  "😬","🤤","😷","🤒","🤕","🤧","🤮","🤢","😈","👿","💀","👻","👽","🤖","💩",
  "👍","👎","👏","🙌","🙏","🤝","💪","🫶","🤟","✌️","👌","👉","👈","👇","👆","☝️",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","💖","💘","💝","💫","✨","⭐️","🔥","🎉",
  "🌟","⚡️","❄️","🌈","🍕","🍔","🍟","🍩","🍰","🍓","🍎","🍇","🍪","☕️","🍺","🎧",
];

// ---- NEW: Default music catalog (replace the URLs with your own hosted mp3 assets) ----
const DEFAULT_MUSIC: { label: string; url: string }[] = [
  { label: "Chill Vibes", url: "https://cdn.example.com/music/chill_vibes.mp3" },
  { label: "Uplift Pop", url: "https://cdn.example.com/music/uplift_pop.mp3" },
  { label: "Ambient Pad", url: "https://cdn.example.com/music/ambient_pad.mp3" },
  { label: "Lo-fi Beat", url: "https://cdn.example.com/music/lofi_beat.mp3" },
  { label: "Acoustic Loop", url: "https://cdn.example.com/music/acoustic_loop.mp3" },
  { label: "Cinematic Rise", url: "https://cdn.example.com/music/cinematic_rise.mp3" },
];

export const StoryComposer: React.FC<Props> = ({ file, onCancel, onPublish }) => {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  const isVideo = file.type.startsWith("video/");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicVolume, setMusicVolume] = useState(0.8);

  // NEW: UI states for palettes/preview
  const [showEmojiPalette, setShowEmojiPalette] = useState(true);
  const [selectedDefaultMusic, setSelectedDefaultMusic] = useState<string>(""); // label for UI
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const addOverlay = (type: "text" | "emoji", initialText = type === "emoji" ? "🙂" : "Your text") => {
    const id = Math.random().toString(36).slice(2);
    setOverlays((prev) => [
      ...prev,
      { id, type, text: initialText, xPct: 50, yPct: 50, fontSize: type === "emoji" ? 48 : 22, color: "#ffffff", weight: 700, rotateDeg: 0 },
    ]);
    setActiveId(id);
  };

  const removeOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    if (activeId === id) setActiveId(null);
  };

  // Drag support
  const dragInfo = useRef<{ id: string; startX: number; startY: number; startXPct: number; startYPct: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent, id: string) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const overlay = overlays.find((o) => o.id === id);
    if (!overlay) return;
    dragInfo.current = { id, startX: e.clientX, startY: e.clientY, startXPct: overlay.xPct, startYPct: overlay.yPct };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveId(id);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragInfo.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dxPct = ((e.clientX - dragInfo.current.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - dragInfo.current.startY) / rect.height) * 100;
    setOverlays((prev) =>
      prev.map((o) =>
        o.id === dragInfo.current!.id
          ? { ...o, xPct: clamp(dragInfo.current!.startXPct + dxPct, 0, 100), yPct: clamp(dragInfo.current!.startYPct + dyPct, 0, 100) }
          : o
      )
    );
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragInfo.current) {
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    }
    dragInfo.current = null;
  };

  const active = overlays.find((o) => o.id === activeId) || null;
  const updateActive = (patch: Partial<OverlayItem>) => {
    if (!active) return;
    setOverlays((prev) => prev.map((o) => (o.id === active.id ? { ...o, ...patch } : o)));
  };

  // ---- NEW: Emoji palette helpers ----
  const handlePickEmoji = (emoji: string) => {
    addOverlay("emoji", emoji);
  };

  // ---- NEW: Music picker / preview ----
  const handlePickDefaultMusic = (label: string, url: string) => {
    setSelectedDefaultMusic(label);
    setMusicUrl(url);       // default music simply populates musicUrl
  };

  const handlePreviewMusic = async () => {
    if (!musicUrl) return;
    if (!musicAudioRef.current) return;
    musicAudioRef.current.volume = Math.min(1, Math.max(0, musicVolume));
    try {
      await musicAudioRef.current.play();
      setIsPreviewing(true);
    } catch {
      // autoplay may be blocked; user needs to interact (click) which they just did
    }
  };

  const handleStopPreview = () => {
    try { musicAudioRef.current?.pause(); } catch {}
    setIsPreviewing(false);
  };

  const handlePublish = () => {
    onPublish({
      caption: caption.trim() || undefined,
      overlays,
      musicUrl: musicUrl.trim() || undefined,
      musicVolume,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      {/* Modal card */}
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b bg-white">
          <h3 className="font-semibold">Create Story</h3>
          <button onClick={onCancel} className="p-2 rounded hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-white">
          <div className="h-full flex overflow-hidden">
            {/* Preview */}
            <div className="flex-1 flex items-center justify-center bg-black">
              <div
                ref={containerRef}
                className="relative w-full max-w-[400px] max-h-[72vh] aspect-[9/16] bg-black rounded-lg overflow-hidden"
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                {isVideo ? (
                  <video src={url} className="w-full h-full object-contain" autoPlay muted loop />
                ) : (
                  <img src={url} className="w-full h-full object-contain" alt="" />
                )}

                {overlays.map((o) => (
                  <div
                    key={o.id}
                    className={`absolute cursor-move select-none ${activeId === o.id ? "ring-2 ring-purple-400 rounded" : ""}`}
                    style={{
                      left: `${o.xPct}%`,
                      top: `${o.yPct}%`,
                      transform: `translate(-50%, -50%) rotate(${o.rotateDeg ?? 0}deg)`,
                      fontSize: (o.fontSize ?? 22) + "px",
                      color: o.color ?? "#fff",
                      fontWeight: (o.weight ?? 700) as any,
                      textShadow: "0 2px 6px rgba(0,0,0,0.6)",
                      whiteSpace: "pre-wrap",
                      textAlign: "center",
                      pointerEvents: "auto",
                    }}
                    onPointerDown={(e) => onPointerDown(e, o.id)}
                    onClick={() => setActiveId(o.id)}
                  >
                    {o.text}
                  </div>
                ))}

                {caption && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-black/50 text-white rounded px-3 py-2 text-sm">{caption}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Tools (scrollable) */}
            <div className="w-96 border-l p-4 space-y-4 overflow-y-auto">
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => addOverlay("text")}>
                  <Type className="h-4 w-4" /> Add Text
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setShowEmojiPalette((s) => !s)}>
                  <Smile className="h-4 w-4" /> Emojis {showEmojiPalette ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {/* NEW: Emoji palette */}
              {showEmojiPalette && (
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-2">Tap any emoji to add as a sticker (add as many as you like)</div>
                  <div className="grid grid-cols-8 gap-2 text-xl">
                    {EMOJI_PALETTE.map((em, idx) => (
                      <button
                        key={idx}
                        className="h-9 w-9 flex items-center justify-center rounded hover:bg-gray-100"
                        onClick={() => handlePickEmoji(em)}
                        title={em}
                        type="button"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected overlay editor */}
              {active && (
                <div className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">Selected {active.type === "emoji" ? "Emoji" : "Text"}</div>
                    <button className="p-2 rounded hover:bg-gray-100" onClick={() => removeOverlay(active.id)} aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <label className="block text-xs text-gray-600 mb-1">Content</label>
                  <input className="w-full border rounded px-2 py-1" value={active.text} onChange={(e) => updateActive({ text: e.target.value })} />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Font size</label>
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1"
                        value={active.fontSize ?? 22}
                        onChange={(e) => updateActive({ fontSize: Number(e.target.value || 22) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Weight</label>
                      <select className="w-full border rounded px-2 py-1" value={active.weight ?? 700} onChange={(e) => updateActive({ weight: Number(e.target.value) })}>
                        <option value={400}>400</option>
                        <option value={600}>600</option>
                        <option value={700}>700</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Color</label>
                      <input type="color" className="w-full border rounded px-2 py-1 h-9" value={active.color ?? "#ffffff"} onChange={(e) => updateActive({ color: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Rotate</label>
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1"
                        value={active.rotateDeg ?? 0}
                        onChange={(e) => updateActive({ rotateDeg: Number(e.target.value || 0) })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Caption */}
              <div className="space-y-2">
                <label className="block text-xs text-gray-600">Caption</label>
                <textarea
                  className="w-full border rounded px-2 py-1"
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Say something..."
                />
              </div>

              {/* NEW: Default music picker */}
              <div className="space-y-2">
                <label className="block text-xs text-gray-600 flex items-center gap-2"><Music className="h-4 w-4" /> Default Music</label>
                <select
                  className="w-full border rounded px-2 py-2"
                  value={selectedDefaultMusic}
                  onChange={(e) => {
                    const pick = DEFAULT_MUSIC.find((m) => m.label === e.target.value);
                    setSelectedDefaultMusic(e.target.value);
                    if (pick) setMusicUrl(pick.url);
                  }}
                >
                  <option value="">— Select a track (optional) —</option>
                  {DEFAULT_MUSIC.map((m) => (
                    <option key={m.label} value={m.label}>{m.label}</option>
                  ))}
                </select>

                {/* Custom URL still possible */}
                <label className="block text-xs text-gray-600">Or paste a Music URL</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  placeholder="https://your-cdn.com/track.mp3"
                />

                <div className="flex items-center gap-2">
                  <label className="block text-xs text-gray-600">Volume: {(musicVolume * 100) | 0}%</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={musicVolume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setMusicVolume(v);
                      if (musicAudioRef.current) musicAudioRef.current.volume = Math.min(1, Math.max(0, v));
                    }}
                    className="w-full"
                  />
                </div>

                {/* Preview controls */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePreviewMusic}
                    disabled={!musicUrl}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" /> Preview
                  </button>
                <button
                    type="button"
                    onClick={handleStopPreview}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    <Square className="h-4 w-4" /> Stop
                  </button>
                </div>
                <audio ref={musicAudioRef} src={musicUrl || undefined} />
                <div className="text-xs text-gray-500">{isPreviewing && musicUrl ? "Playing…" : ""}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 sticky bottom-0 bg-white border-t px-4 py-3 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button onClick={handlePublish} className="inline-flex items-center gap-2 px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700">
            <Check className="h-4 w-4" /> Publish
          </button>
        </div>
      </div>
    </div>
  );
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
