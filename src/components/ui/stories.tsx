import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStories, Story } from '@/contexts/StoryContext';
import { Camera } from 'lucide-react';
import { StoryViewer } from './StoryViewer';
import { stripUploads } from '@/lib/url';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

const Stories: React.FC = () => {
  const { user } = useAuth();
  const { stories, addStory } = useStories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Which user's story group is open
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  // Which item inside that group to start on (0 by default; last if we chain backward)
  const [viewerInitialIndex, setViewerInitialIndex] = useState<number>(0);

  const viewerGroup: Story | null =
    viewerIndex !== null && stories[viewerIndex] ? stories[viewerIndex] : null;

  const handleAddClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addStory(file);
    e.target.value = '';
  };

  const handleBubbleClick = (index: number) => {
    setViewerIndex(index);
    setViewerInitialIndex(0);
  };

  // Parent handles why viewer closed:
  // - 'finished'  → autoplay finished current group → open next user (start at 0)
  // - 'user'      → user clicked close/Esc         → close viewer
  // - 'prevGroup' → user pressed Prev at first item → open previous user (start at last item)
  const handleCloseViewer = (reason: 'finished' | 'user' | 'prevGroup') => {
    if (reason === 'finished') {
      setViewerIndex((i) => {
        if (i == null) return i;
        const next = i + 1;
        if (next >= stories.length) return null;
        setViewerInitialIndex(0);
        return next;
      });
      return;
    }

    if (reason === 'prevGroup') {
      setViewerIndex((i) => {
        if (i == null) return i;
        const prev = i - 1;
        if (prev < 0) return null; // or loop: return stories.length - 1
        const lastIdx =
          stories[prev]?.stories?.length ? stories[prev].stories.length - 1 : 0;
        setViewerInitialIndex(lastIdx);
        return prev;
      });
      return;
    }

    // reason === 'user'
    setViewerIndex(null);
  };

  // If the stories array shrinks while viewing, close gracefully
  useEffect(() => {
    if (viewerIndex !== null && viewerIndex >= stories.length) {
      setViewerIndex(null);
    }
  }, [stories.length, viewerIndex]);

  return (
    <div className="mb-6">
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {/* Your story bubble */}
        {user && (
          <div className="flex-shrink-0 text-center">
            <div
              className="relative w-16 h-16 rounded-full ring-2 ring-purple-400 overflow-hidden mx-auto cursor-pointer"
              onClick={handleAddClick}
            >
              {user.profileImage ? (
                <img
                  src={API_BASE_URL + '/uploads/' + stripUploads(user.profileImage)}
                  alt="Your story"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-gray-500" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5">
                <Camera className="h-4 w-4 text-purple-500" />
              </div>
            </div>
            <span className="mt-1 block text-xs text-gray-700 truncate w-16">Your Story</span>

            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Friends' stories */}
        {stories.map((group, i) => (
          <div
            key={group.userId ?? i}
            className="flex-shrink-0 text-center cursor-pointer"
            onClick={() => handleBubbleClick(i)}
          >
            <div className="w-16 h-16 rounded-full ring-2 ring-purple-400 overflow-hidden mx-auto">
              <img
                src={
                  API_BASE_URL +
                  '/uploads/' +
                  stripUploads(group.avatar !== '' ? group.avatar : '/profile/defaultavatar.png')
                }
                alt={group.username}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = API_BASE_URL + '/uploads//profile/defaultavatar.png';
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="mt-1 block text-xs text-gray-700 truncate w-16">
              {group.username}
            </span>
          </div>
        ))}
      </div>

      {/* Story viewer modal */}
      {viewerGroup && (
        <StoryViewer
          key={`${stories[viewerIndex!]?.userId ?? viewerIndex}-${viewerInitialIndex}`} // force remount per group & starting slide
          group={viewerGroup}
          initialIndex={viewerInitialIndex}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
};

export default Stories;
