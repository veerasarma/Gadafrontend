import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, PencilLine, UserPlus } from 'lucide-react';
import { ProfileImageUpload } from './ProfileImageUpload';
import { stripUploads } from '@/lib/url';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

import { encodeId } from '@/lib/idCipher';

interface ProfileHeaderProps {
  profile: User;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user, updateProfile } = useAuth();
  const [isCurrentUser] = useState(user?.id == profile.user_id);
  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [isCoverImageModalOpen, setIsCoverImageModalOpen] = useState(false);

  
  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  const handleProfileImageSave = (imageUrl: string) => {
    if (user && isCurrentUser) {
      profile.profileImage = imageUrl;
      updateProfile({ profileImage: imageUrl });
      setIsProfileImageModalOpen(false);
    }
  };
  
  const handleCoverImageSave = (imageUrl: string) => {
    if (user && isCurrentUser) {
      profile.coverImage = imageUrl;
      updateProfile({ coverImage: imageUrl });
      setIsCoverImageModalOpen(false);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
      {/* Cover Image */}
      <div 
        className="h-48 md:h-64 bg-gradient-to-r from-blue-100 to-blue-200 relative" 
        style={{
          backgroundImage: `url(${API_BASE_URL+'/uploads/'+stripUploads(profile.coverImage)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {isCurrentUser && (
          <Button 
            size="icon"
            variant="secondary"
            className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm hover:bg-white"
            onClick={() => setIsCoverImageModalOpen(true)}
          >
            <Camera className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Profile info */}
      <div className="relative px-4 sm:px-6 pb-4">
        {/* Profile picture */}
        <div className="absolute -top-16 left-6 border-4 border-white rounded-full">
          <Avatar className="h-32 w-32">
            <AvatarImage src={API_BASE_URL+'/uploads/'+stripUploads(profile.profileImage)} alt={profile.username} />
            <AvatarFallback className="text-3xl">{getInitials(profile.username)}</AvatarFallback>
          </Avatar>
          {isCurrentUser && (
            <Button 
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 bg-white/80 backdrop-blur-sm hover:bg-white h-8 w-8"
              onClick={() => setIsProfileImageModalOpen(true)}
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* User details */}
        <div className="pt-16 pb-2 flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            <p className="text-gray-500 text-sm">
              {/* {profile.friends.length} {profile.friends.length === 1 ? 'friend' : 'friends'} */}
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-2">
            {isCurrentUser ? (
              <Button className="flex items-center" variant="outline">
                <PencilLine className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
            ) : (
              <Button className="bg-[#1877F2] hover:bg-[#166FE5] flex items-center">
                <UserPlus className="h-4 w-4 mr-2" /> Add Friend
              </Button>
            )}
          </div>
        </div>
        
        {/* Bio */}
        {profile.bio && (
          <p className="text-gray-600 mt-2">{profile.bio}</p>
        )}
      </div>
      <ProfileImageUpload
        isOpen={isProfileImageModalOpen}
        onClose={() => setIsProfileImageModalOpen(false)}
        onSave={handleProfileImageSave}
        title="Change Profile Picture"
        type="profile"
        description="Upload a new profile picture or enter an image URL"
      />
      
      {/* Cover image upload modal */}
      <ProfileImageUpload
        isOpen={isCoverImageModalOpen}
        onClose={() => setIsCoverImageModalOpen(false)}
        onSave={handleCoverImageSave}
        title="Change Cover Photo"
        type="cover"
        description="Upload a new cover photo or enter an image URL"
      />
    </div>
  );
}