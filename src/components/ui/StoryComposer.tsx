import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Smile, Trash2, Check, Music, Type, Palette } from "lucide-react";

export type OverlayItem = {
  id: string; type: "text" | "emoji"; text: string;
  xPct: number; yPct: number; fontSize?: number; color?: string; rotateDeg?: number; weight?: number;
};
export type StoryMeta = {
  caption?: string; overlays?: OverlayItem[];
  musicUrl?: string; musicVolume?: number;
  text?: string; bg?: string; color?: string;
};
type Props = { file?: File | null; onCancel: () => void; onPublish: (meta: StoryMeta, file?: File | null) => void; };

const EMOJI_PALETTE = [
  "😀","😃","😄","😁","😆","🥹","😊","🙂","😉","😍","😘","😜","🤩","🥳","🤗","😎",
  "😇","🤔","🤨","😐","😴","🥱","😪","😮","😯","😲","😳","🥵","🥶","😱","😭","😅",
  "😬","🤤","😷","🤒","🤕","🤧","🤮","🤢","😈","👿","💀","👻","👽","🤖","💩",
  "👍","👎","👏","🙌","🙏","🤝","💪","🫶","🤟","✌️","👌","👉","👈","👇","👆","☝️",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","💖","💘","💝","💫","✨","⭐️","🔥","🎉",
  "🌟","⚡️","❄️","🌈","🍕","🍔","🍟","🍩","🍰","🍓","🍎","🍇","🍪","☕️","🍺","🎧",
];


export const StoryComposer: React.FC<Props> = ({ file, onCancel, onPublish }) => {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const isVideo = !!file && file.type.startsWith("video/");
  const isTextOnly = !file;
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicVolume, setMusicVolume] = useState(0.8);

  // text-only
  const [textOnly, setTextOnly] = useState("");
  const [bg, setBg] = useState("#111111");
  const [fg, setFg] = useState("#ffffff");

  const addOverlay = (type: "text" | "emoji", initialText = type === "emoji" ? "🙂" : "Your text") => {
    const id = Math.random().toString(36).slice(2);
    setOverlays((prev) => [...prev, { id, type, text: initialText, xPct: 50, yPct: 50, fontSize: type === "emoji" ? 48 : 22, color: "#ffffff", weight: 700, rotateDeg: 0 }]);
    setActiveId(id);
  };

  const dragInfo = useRef<{ id: string; x0: number; y0: number; xp: number; yp: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent, id: string) => {
    const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return;
    const overlay = overlays.find((o) => o.id === id)!;
    dragInfo.current = { id, x0: e.clientX, y0: e.clientY, xp: overlay.xPct, yp: overlay.yPct };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveId(id);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragInfo.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragInfo.current.x0) / rect.width) * 100;
    const dy = ((e.clientY - dragInfo.current.y0) / rect.height) * 100;
    setOverlays((prev) => prev.map((o) => (o.id === dragInfo.current!.id ? { ...o, xPct: clamp(dragInfo.current!.xp + dx, 0, 100), yPct: clamp(dragInfo.current!.yp + dy, 0, 100) } : o)));
  };
  const onPointerUp = (e: React.PointerEvent) => { try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}; dragInfo.current = null; };

  const active = overlays.find((o) => o.id === activeId) || null;
  const updateActive = (patch: Partial<OverlayItem>) => active && setOverlays((prev) => prev.map((o) => (o.id === active.id ? { ...o, ...patch } : o)));

  const publish = () => {
    const meta: StoryMeta = {
      caption: caption.trim() || undefined,
      overlays,
      musicUrl: musicUrl.trim() || undefined,
      musicVolume,
      ...(isTextOnly ? { text: textOnly.trim(), bg, color: fg } : {}),
    };
    onPublish(meta, file || null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b bg-white">
          <h3 className="font-semibold">Create story</h3>
          <button onClick={onCancel} className="p-2 rounded hover:bg-gray-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-hidden bg-white">
          <div className="h-full flex overflow-hidden">
            {/* Preview */}
            <div className="flex-1 flex items-center justify-center bg-black">
              <div
                ref={containerRef}
                className="relative w-full max-w-[400px] max-h-[72vh] aspect-[9/16] rounded-lg overflow-hidden"
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={isTextOnly ? { background: bg } : {}}
              >
                {isTextOnly ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="px-6 text-2xl font-semibold text-center whitespace-pre-wrap" style={{ color: fg }}>
                      {textOnly || "Type your write-up…"}
                    </div>
                  </div>
                ) : !file ? null : file.type.startsWith("video/") ? (
                  <video src={url} className="w-full h-full object-contain" autoPlay muted loop />
                ) : (
                  <img src={url} className="w-full h-full object-contain" alt="" />
                )}

                {overlays.map((o) => (
                  <div
                    key={o.id}
                    className={`absolute cursor-move select-none ${activeId === o.id ? "ring-2 ring-[#1877F2] rounded" : ""}`}
                    style={{
                      left: `${o.xPct}%`, top: `${o.yPct}%`, transform: `translate(-50%, -50%) rotate(${o.rotateDeg ?? 0}deg)`,
                      fontSize: (o.fontSize ?? 22) + "px", color: o.color ?? "#fff", fontWeight: (o.weight ?? 700) as any,
                      textShadow: "0 2px 6px rgba(0,0,0,0.6)", whiteSpace: "pre-wrap", textAlign: "center",
                    }}
                    onPointerDown={(e) => onPointerDown(e, o.id)}
                    onClick={() => setActiveId(o.id)}
                  >
                    {o.text}
                  </div>
                ))}

                {caption && !isTextOnly && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-black/50 text-white rounded px-3 py-2 text-sm">{caption}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Tools */}
            <div className="w-96 border-l p-4 space-y-4 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {/* <button className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => addOverlay("text")}><Type className="h-4 w-4" /> Add Text</button>
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => addOverlay("emoji","🙂")}><Smile className="h-4 w-4" /> Add Emoji</button> */}

                <div className="space-y-2">
  <label className="block text-xs text-gray-600 flex items-center gap-2">
    <Smile className="h-4 w-4" /> Emoji Palette
  </label>
  <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto border rounded p-2">
    {EMOJI_PALETTE.map((emo) => (
      <button
        key={emo}
        type="button"
        className="px-1 py-0.5 text-xl hover:bg-gray-200 rounded"
        onClick={() => addOverlay("emoji", emo)}
      >
        {emo}
      </button>
    ))}
  </div>
</div>
                {isTextOnly && (
                  <>
                    <div className="w-full" />
                    <div className="space-y-2 w-full">
                      <label className="block text-xs text-gray-600">Write-up</label>
                      <textarea className="w-full border rounded px-2 py-1" rows={5} value={textOnly} onChange={(e) => setTextOnly(e.target.value)} placeholder="Type your story…" />
                    </div>
                    <div className="flex items-center gap-3 w-full">
                      <label className="text-xs text-gray-600 flex items-center gap-1"><Palette className="h-4 w-4" /> Background</label>
                      <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
                      <label className="text-xs text-gray-600 ml-4">Text</label>
                      <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
                    </div>
                  </>
                )}
              </div>

              {/* Selected overlay editor */}
              {active && (
                <div className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">Selected {active.type === "emoji" ? "Emoji" : "Text"}</div>
                    <button className="p-2 rounded hover:bg-gray-100" onClick={() => setOverlays((p) => p.filter((x) => x.id !== active.id))}><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <label className="block text-xs text-gray-600 mb-1">Content</label>
                  <input className="w-full border rounded px-2 py-1" value={active.text} onChange={(e) => updateActive({ text: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-1">Font size</label>
                      <input type="number" className="w-full border rounded px-2 py-1" value={active.fontSize ?? 22} onChange={(e) => updateActive({ fontSize: Number(e.target.value || 22) })} />
                    </div>
                    <div><label className="block text-xs text-gray-600 mb-1">Weight</label>
                      <select className="w-full border rounded px-2 py-1" value={active.weight ?? 700} onChange={(e) => updateActive({ weight: Number(e.target.value) })}>
                        <option value={400}>400</option><option value={600}>600</option><option value={700}>700</option>
                      </select>
                    </div>
                    <div><label className="block text-xs text-gray-600 mb-1">Color</label>
                      <input type="color" className="w-full border rounded px-2 py-1 h-9" value={active.color ?? "#ffffff"} onChange={(e) => updateActive({ color: e.target.value })} />
                    </div>
                    <div><label className="block text-xs text-gray-600 mb-1">Rotate</label>
                      <input type="number" className="w-full border rounded px-2 py-1" value={active.rotateDeg ?? 0} onChange={(e) => updateActive({ rotateDeg: Number(e.target.value || 0) })} />
                    </div>
                  </div>
                </div>
              )}

              {!isTextOnly && (
                <div className="space-y-2">
                  <label className="block text-xs text-gray-600">Caption</label>
                  <textarea className="w-full border rounded px-2 py-1" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Say something..." />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs text-gray-600 flex items-center gap-2"><Music className="h-4 w-4" /> Music (optional)</label>
                <input className="w-full border rounded px-2 py-1" value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} placeholder="https://your-cdn/track.mp3" />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Volume: {(musicVolume * 100) | 0}%</label>
                  <input type="range" min={0} max={1} step={0.01} value={musicVolume} onChange={(e) => setMusicVolume(Number(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 sticky bottom-0 bg-white border-t px-4 py-3 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button onClick={publish} className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#1877F2] text-white hover:bg-[#1865d6]">
            <Check className="h-4 w-4" /> Publish
          </button>
        </div>
      </div>
    </div>
  );
};

function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }
