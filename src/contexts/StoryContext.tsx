import { createContext, useContext, useEffect, useState } from 'react';
import { fetchStories, uploadStory, Story } from '@/services/storyService';
import { useAuthHeader,useAuthHeaderupload } from '@/hooks/useAuthHeader';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const StoryContext = createContext(null!);

export function StoryProvider({ children }) {
  const { user,accessToken }  = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const headers = useAuthHeader(accessToken);
  const headers1 = useAuthHeaderupload(accessToken);

  useEffect(() => {
    if (!accessToken) return;   
    fetchStories(headers).then(setStories).catch(console.error);
    // optionally poll every minute:
    const id = setInterval(() => fetchStories(headers).then(setStories), 60000);
    return () => clearInterval(id);
  }, [accessToken]);

  const addStory = async (file: File) => {
    const { id, url, type } = await uploadStory(file, headers1);
    // append to current user’s bucket
    setStories(prev => {
      const me = prev.find(s => s.userId == user.id);
      if (me) me.stories.unshift({ id, url, type, createdAt: new Date().toISOString() });
      toast.success('Story updated successfully ');
      return [...prev];
    });
  };

  return (
    <StoryContext.Provider value={{ stories, addStory }}>
      {children}
    </StoryContext.Provider>
  );
}

export const useStories = () => useContext(StoryContext);
