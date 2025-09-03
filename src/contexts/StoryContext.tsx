// StoryContext.tsx — DROP-IN
import { createContext, useContext, useEffect, useState } from "react";
import { fetchStories, uploadStory, Story, StoryMeta } from "@/services/storyService";
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

  return (
    <StoryContext.Provider value={{ stories, addStory }}>
      {children}
    </StoryContext.Provider>
  );
}

export const useStories = () => useContext(StoryContext);
