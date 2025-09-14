// StoryContext.tsx — DROP-IN
import { createContext, useContext, useEffect, useState } from "react";
import { fetchStories, uploadStory, Story, StoryMeta, addTextStory as apiAddTextStory, TextStoryMeta } from "@/services/storyService";
import { useAuthHeader, useAuthHeaderupload } from "@/hooks/useAuthHeader";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

type Ctx = {
  stories: Story[];
  addStory: (file: File, meta: StoryMeta) => Promise<void>;
};

const StoryContext = createContext<Ctx>(null!);

export function StoryProvider({ children }) {
  const { user, accessToken } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const headers = useAuthHeader(accessToken);         // for JSON GET
  const headersUpload = useAuthHeaderupload(accessToken); // for multipart POST

  useEffect(() => {
    if (!accessToken) return;
    fetchStories(headers).then(setStories).catch(console.error);
    const id = setInterval(() => fetchStories(headers).then(setStories).catch(() => {}), 60000);
    return () => clearInterval(id);
  }, [accessToken]);

  const addStory = async (file: File, meta: StoryMeta) => {
    const { url, type, meta: savedMeta } = await uploadStory(file, meta, headersUpload);

    // Optimistically add to current user’s bucket with meta
    setStories((prev) => {
      const meIdx = prev.findIndex((g) => String(g.userId) === String(user.id ?? user.userId));
      const newItem = { url, type, meta: savedMeta || meta };
      if (meIdx >= 0) {
        const copy = [...prev];
        copy[meIdx] = {
          ...copy[meIdx],
          stories: [...copy[meIdx].stories, newItem],
        };
        return copy;
      }
      // if no bucket yet, create one
      return [
        ...prev,
        {
          userId: user.id ?? user.userId,
          username: user.name ?? user.username ?? "You",
          avatar: user.profileImage ?? "",
          stories: [newItem],
        },
      ];
    });
    toast.success("Story published");
  };

  async function addTextStory(meta: TextStoryMeta) {
    const payload = {
      text: (meta.text || "").trim(),
      bg: meta.bg ?? "#111111",
      color: meta.color ?? "#ffffff",
      overlays: meta.overlays ?? null,
      music_url: meta.musicUrl ?? null,
      music_volume: typeof meta.musicVolume === "number" ? meta.musicVolume : null,
    };
    const res = await apiAddTextStory(payload,headers);
    if (!res?.ok) throw new Error("Failed to create text story");

    // The API returns: { ok:true, item:{ id,type:'text',url:'',meta,created_at } }
    const newItem: StoryItem = {
      id: res.item?.id,
      type: "text",
      url: "",
      meta: res.item?.meta || { text: payload.text, bg: payload.bg, color: payload.color },
      created_at: res.item?.created_at,
    };

    const uid = Number((user as any)?.userId ?? (user as any)?._id);
    const uname = (user as any)?.user_name || (user as any)?.username || "You";
    const uavatar = (user as any)?.user_profile_picture || (user as any)?.avatar || "";

    setStories((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((g) => Number(g.userId) === uid);
      if (idx >= 0) {
        // push at end (so newest bubble shows text thumb); FB actually treats as latest
        arr[idx] = { ...arr[idx], stories: [...arr[idx].stories, newItem] };
        // ensure current user group is first
        const [mine] = arr.splice(idx, 1);
        arr.unshift(mine);
        return arr;
      }
      // create my group at top if not present
      return [{ userId: uid, username: uname, avatar: uavatar, stories: [newItem] }, ...arr];
    });
  }

  return (
    <StoryContext.Provider value={{ stories, addStory, addTextStory }}>
      {children}
    </StoryContext.Provider>
  );
}

export const useStories = () => useContext(StoryContext);
