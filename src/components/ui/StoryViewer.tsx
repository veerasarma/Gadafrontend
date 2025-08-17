// StoryViewer.tsx
import { Story } from '@/services/storyService';
import { useEffect, useState } from 'react';
import { stripUploads } from '@/lib/url';
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

interface Props { group: Story; onClose: ()=>void; }
export function StoryViewer({ group, onClose }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (idx < group.stories.length - 1) setIdx(idx + 1);
      else onClose();
    }, group.stories[idx].type === 'video' ? 5000 : 3000);
    return () => clearTimeout(timeout);
  }, [idx]);

  const story = group.stories[idx];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="relative max-w-lg w-full">
        {story.type === 'image' ? (
          <img src={API_BASE_URL+'/uploads/'+stripUploads(story.url)} className="w-full rounded" />
        ) : (
          <video src={API_BASE_URL+'/uploads/'+stripUploads(story.url)} autoPlay muted className="w-full rounded" />
        )}
        <button
          className="absolute top-2 right-2 text-white"
          onClick={onClose}
        >✕</button>
      </div>
    </div>
  );
}
