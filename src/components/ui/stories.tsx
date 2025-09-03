// Stories.tsx (DROP-IN REPLACEMENT)
import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStories, Story } from "@/contexts/StoryContext";
import { Camera } from "lucide-react";
import { StoryViewer } from "./StoryViewer";
import { stripUploads } from "@/lib/url";
import { StoryComposer, StoryMeta } from "./StoryComposer";

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

const Stories: React.FC = () => {
  const { user } = useAuth();
  const { stories, addStory } = useStories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerInitialIndex, setViewerInitialIndex] = useState<number>(0);

  const viewerGroup: Story | null =
    viewerIndex !== null && stories[viewerIndex] ? stories[viewerIndex] : null;

  const handleAddClick = () => fileInputRef.current?.click();

  // ⛔️ Stop auto-post; open composer instead
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    setPendingFile(file);
    setShowComposer(true);
  };

  const handleComposerCancel = () => {
    setShowComposer(false);
    setPendingFile(null);
  };

  // Open your newly posted story (last item) after publish
  const openMyLatestStory = () => {
    setTimeout(() => {
      const myId = (user as any)?.userId ?? (user as any)?._id;
      const ix = stories.findIndex((g) => String(g.userId) === String(myId));
      if (ix >= 0) {
        const lastIdx = Math.max(0, (stories[ix]?.stories?.length ?? 1) - 1);
        setViewerInitialIndex(lastIdx);
        setViewerIndex(ix);
      }
    }, 400);
  };

  const handleComposerPublish = async (meta: StoryMeta) => {
    try {
      if (!pendingFile) return;
      console.log(meta,'metametameta')
      // Backward-compatible call: prefer (file, meta) if supported
      // if ((addStory as any).length >= 2) {
        await (addStory as any)(pendingFile, meta);
      // } else {
        // await (addStory as any)(pendingFile);
      // }
    } finally {
      setShowComposer(false);
      setPendingFile(null);
      openMyLatestStory();
    }
  };

  const handleBubbleClick = (index: number) => {
    setViewerIndex(index);
    setViewerInitialIndex(0);
  };

  const handleCloseViewer = (reason: "finished" | "user" | "prevGroup") => {
    if (reason === "finished") {
      setViewerIndex((i) => {
        if (i == null) return i;
        const next = i + 1;
        if (next >= stories.length) return null;
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
        const lastIdx = stories[prev]?.stories?.length ? stories[prev].stories.length - 1 : 0;
        setViewerInitialIndex(lastIdx);
        return prev;
      });
      return;
    }
    setViewerIndex(null);
  };

  useEffect(() => {
    if (viewerIndex !== null && viewerIndex >= stories.length) setViewerIndex(null);
  }, [stories.length, viewerIndex]);

  return (
    <div className="mb-6">
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {/* Add new */}
        {user && (
          <div className="flex-shrink-0 text-center">
            <div className="relative w-16 h-16 rounded-full ring-2 ring-purple-400 overflow-hidden mx-auto cursor-pointer" onClick={handleAddClick}>
              {user.profileImage ? (
                <img
                  src={API_BASE_URL + "/uploads/" + stripUploads(user.profileImage)}
                  alt="Your story"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-gray-500" />
                </div>
              )}
            </div>
            <span className="mt-1 block text-xs text-gray-700 truncate w-16">Your Story</span>
            <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          </div>
        )}

        {/* Bubbles */}
        {stories.map((group, i) => (
          <div key={group.userId ?? i} className="flex-shrink-0 text-center cursor-pointer" onClick={() => handleBubbleClick(i)}>
            <div className="w-16 h-16 rounded-full ring-2 ring-purple-400 overflow-hidden mx-auto">
              <img
                src={API_BASE_URL + "/uploads/" + stripUploads(group.avatar || "/profile/defaultavatar.png")}
                alt={group.username}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = API_BASE_URL + "/uploads//profile/defaultavatar.png";
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="mt-1 block text-xs text-gray-700 truncate w-16">{group.username}</span>
          </div>
        ))}
      </div>

      {viewerIndex !== null && stories[viewerIndex] && (
        <StoryViewer
          key={`${stories[viewerIndex!]?.userId ?? viewerIndex}-${viewerInitialIndex}`}
          group={stories[viewerIndex!]}
          initialIndex={viewerInitialIndex}
          onClose={handleCloseViewer}
        />
      )}

      {/* Composer */}
      {showComposer && pendingFile && (
        <StoryComposer file={pendingFile} onCancel={handleComposerCancel} onPublish={handleComposerPublish} />
      )}
    </div>
  );
};

export default Stories;
