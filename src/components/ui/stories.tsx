

// src/components/Stories.tsx
import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStories, Story } from '@/contexts/StoryContext';
import { Camera } from 'lucide-react';
import { StoryViewer } from './StoryViewer';
import { stripUploads } from '@/lib/url';
// import { resolveMediaUrl } from '@/lib/mediaUrl';
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

const Stories: React.FC = () => {
  const { user } = useAuth();
  const { stories, addStory } = useStories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewerGroup, setViewerGroup] = useState<Story | null>(null);

  // trigger the hidden file input
  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  // when user picks a file, upload it as a new story
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addStory(file);
    e.target.value = '';
  };

  // when a bubble is clicked, open the StoryViewer
  const handleBubbleClick = (group: Story) => {
    setViewerGroup(group);
  };

  // close the viewer
  const handleCloseViewer = () => {
    setViewerGroup(null);
  };

  return (
    <div className="mb-6">
      {/* <h2 className="text-lg font-semibold text-gray-800 mb-4">Stories</h2> */}
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {/* Your Story bubble */}
        {user && (
          <div className="flex-shrink-0 text-center">
            <div
              className="relative w-16 h-16 rounded-full ring-2 ring-purple-400 overflow-hidden mx-auto cursor-pointer"
              onClick={handleAddClick}
            >
              {user.profileImage ? (
                <img
                  src={(API_BASE_URL+'/uploads/'+stripUploads(user.profileImage))}
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
        {stories.map(group => (
          <div
            key={group.userId}
            className="flex-shrink-0 text-center cursor-pointer"
            onClick={() => handleBubbleClick(group)}
          >
            <div className="w-16 h-16 rounded-full ring-2 ring-purple-400 overflow-hidden mx-auto">
              <img
                src={(API_BASE_URL+'/uploads/'+stripUploads(group.avatar!=""?group.avatar:'/profile/defaultavatar.png'))}
                alt={group.username}
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
        <StoryViewer group={viewerGroup} onClose={handleCloseViewer} />
      )}
    </div>
);
};
export default Stories;

