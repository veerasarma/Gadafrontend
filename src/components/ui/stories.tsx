import React, { useRef, useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStories, Story } from "@/contexts/StoryContext";
import { Camera, Type } from "lucide-react";
import StoryViewer from "./StoryViewer";
import { stripUploads } from "@/lib/url";
import { StoryComposer, StoryMeta } from "./StoryComposer";

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

export default function Stories() {
  const { user } = useAuth();
  // ⬇️ pull setStories so we can mutate state locally after delete
  const { stories, addStory, addTextStory, setStories } = useStories() as any;

  // ensure current user group is first (like Facebook)
  const ordered = useMemo(() => {
    if (!user) return stories || [];
    const mineIdx = (stories || []).findIndex(
      (g: Story) => Number(g.userId) === Number((user as any)?.userId)
    );
    if (mineIdx <= 0) return stories || [];
    const copy = [...stories];
    const [mine] = copy.splice(mineIdx, 1);
    copy.unshift(mine);
    return copy;
  }, [stories, user]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerInitialIndex, setViewerInitialIndex] = useState<number>(0);

  const viewerGroup: Story | null =
    viewerIndex !== null && ordered[viewerIndex] ? ordered[viewerIndex] : null;

  const openFile = () => fileInputRef.current?.click();
  const openWriteup = () => {
    setPendingFile(null);
    setShowComposer(true);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!f) return;
    setPendingFile(f);
    setShowComposer(true);
  };

  const onComposerCancel = () => {
    setShowComposer(false);
    setPendingFile(null);
  };

  const onComposerPublish = async (meta: StoryMeta, file?: File | null) => {
    try {
      if (file) await addStory(file, meta);
      else await addTextStory(meta);
    } finally {
      setShowComposer(false);
      setPendingFile(null);
    }
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerInitialIndex(0);
  };

  // 🔑 NEW: when StoryViewer confirms deletion, remove from state immediately
  const onDeleted = (deletedId: number) => {
    setStories((prev: Story[]) => {
      const next = prev
        .map((g: Story) => ({
          ...g,
          stories: g.stories.filter((s) => Number(s.id) !== Number(deletedId)),
        }))
        .filter((g: Story) => g.stories.length > 0); // drop empty bubbles
      return next;
    });
    setViewerIndex(null);
  };

  const onCloseViewer = (
    reason: "finished" | "user" | "prevGroup" | "deleted"
  ) => {
    if (reason === "deleted") {
      // when StoryViewer uses onDeleted we already closed; keep as fallback
      setViewerIndex(null);
      return;
    }
    if (reason === "finished") {
      setViewerIndex((i) => {
        if (i == null) return i;
        const next = i + 1;
        if (next >= ordered.length) return null;
        setViewerInitialIndex(0);
        return next;
      });
      return;
    }
    if (reason === "prevGroup") {
      setViewerIndex((i) => {
        if (i == null) return i;
        const prev = i - 1;
        if (prev < 0) return null;
        const lastIdx = ordered[prev]?.stories?.length
          ? ordered[prev].stories.length - 1
          : 0;
        setViewerInitialIndex(lastIdx);
        return prev;
      });
      return;
    }
    setViewerIndex(null);
  };

  useEffect(() => {
    if (viewerIndex !== null && viewerIndex >= ordered.length) setViewerIndex(null);
  }, [ordered.length, viewerIndex]);

  // safer text-story thumb renderer
  const getThumb = (g: Story) => {
    const last = g.stories?.[g.stories.length - 1];
    if (!last) return API_BASE_URL + "/uploads//profile/defaultavatar.png";
    if (last.type === "text") return null;
    return API_BASE_URL + "/uploads/" + stripUploads(last.url);
  };

  const parseMetaSafe = (meta: any) => {
    if (!meta) return {};
    if (typeof meta === "string") {
      try {
        return JSON.parse(meta);
      } catch {
        // some backends store as { caption: stringified }
        try {
          const m = JSON.parse((meta as any)?.caption ?? "{}");
          return m || {};
        } catch {
          return {};
        }
      }
    }
    // object
    if (meta.caption && typeof meta.caption === "string") {
      try {
        return JSON.parse(meta.caption);
      } catch {
        return meta;
      }
    }
    return meta;
  };

  return (
    <div className="mb-6">
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {/* Add story tile */}
        {user && (
          <div className="flex-shrink-0 text-center">
            <div className="relative w-16 h-16 rounded-full ring-2 ring-[#1877F2] overflow-hidden mx-auto">
              {user.profileImage ? (
                <img
                  src={
                    API_BASE_URL +
                    "/uploads/" +
                    stripUploads(user.profileImage)
                  }
                  alt="Your story"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-gray-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition flex items-center justify-center gap-2">
                <button
                  title="Add media"
                  onClick={openFile}
                  className="p-1.5 rounded-full bg-white/90 hover:bg-white"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button
                  title="Write-up only"
                  onClick={openWriteup}
                  className="p-1.5 rounded-full bg-white/90 hover:bg-white"
                >
                  <Type className="h-4 w-4" />
                </button>
              </div>
            </div>
            <span className="mt-1 block text-xs text-gray-700 truncate w-16">
              Your story
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={onFileChange}
            />
          </div>
        )}

        {/* Story bubbles (current user first) */}
        {ordered.map((g, i) => {
          const thumb = getThumb(g);
          const last = g.stories[g.stories.length - 1];
          const meta = last?.type === "text" ? parseMetaSafe(last.meta) : null;
          const bg = meta?.bg || "#111";
          const color = meta?.color || "#fff";
          const text = (meta?.text || meta?.caption || "Story").toString();

          return (
            <div
              key={g.userId ?? i}
              className="flex-shrink-0 text-center cursor-pointer"
              onClick={() => openViewer(i)}
            >
              <div className="w-16 h-16 rounded-full ring-2 ring-[#1877F2] overflow-hidden mx-auto">
                {last?.type === "text" ? (
                  <div
                    className="w-full h-full flex items-center justify-center text-[10px] font-semibold px-1 text-center"
                    style={{ background: bg, color }}
                  >
                    {text.slice(0, 16)}
                  </div>
                ) : (
                  <img
                    src={thumb || API_BASE_URL + "/uploads//profile/defaultavatar.png"}
                    alt={g.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        API_BASE_URL + "/uploads//profile/defaultavatar.png";
                    }}
                  />
                )}
              </div>
              <span className="mt-1 block text-xs text-gray-700 truncate w-16">
                {Number(g.userId) === Number((user as any)?.userId)
                  ? "Your story"
                  : g.username}
              </span>
            </div>
          );
        })}
      </div>

      {viewerIndex !== null && viewerGroup && (
        <StoryViewer
          key={`${ordered[viewerIndex!]?.userId ?? viewerIndex}-${viewerInitialIndex}`}
          group={viewerGroup}
          initialIndex={viewerInitialIndex}
          onClose={onCloseViewer}
          // ⬇️ NEW: get the deleted story id so we can remove it from state instantly
          onDeleted={onDeleted}
        />
      )}

      {showComposer && (
        <StoryComposer
          file={pendingFile}
          onCancel={onComposerCancel}
          onPublish={onComposerPublish}
        />
      )}
    </div>
  );
}
