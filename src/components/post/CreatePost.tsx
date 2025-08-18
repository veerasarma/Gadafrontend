import { useState, useRef } from 'react';
import { usePost } from '@/contexts/PostContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, VideoIcon, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { stripUploads } from '@/lib/url';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

export function CreatePost() {
  const { user } = useAuth();
  const { addPost } = usePost();
  const [content, setContent] = useState('');
console.log(user,'useruseruser')
  // Store raw files for upload
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  // Store object URLs for preview
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setImageFiles((prev) => [...prev, ...newFiles]);

    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    // Reset input to allow re-selection
    e.target.value = '';
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setVideoFiles((prev) => [...prev, ...newFiles]);

    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setVideoPreviews((prev) => [...prev, ...newPreviews]);

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && imageFiles.length === 0 && videoFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      await addPost (content, imageFiles, videoFiles);

      // Clean up previews and files
      setContent('');
      setImageFiles([]);
      setVideoFiles([]);
      setImagePreviews([]);
      setVideoPreviews([]);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
  <CardContent className="p-4 md:p-6">
    <form onSubmit={handleSubmit}>
      {/* On small screens stack avatar above form, on md+ sit in a row */}
      <div className="flex flex-col sm:flex-row sm:space-x-3">
        <Avatar className="mb-3 sm:mb-0 h-10 w-10 flex-shrink-0">
          <AvatarImage src={API_BASE_URL+'/uploads/'+stripUploads(user.profileImage)} alt={user.username} />
          <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4">
          <Textarea
            placeholder={`What's on your mind, ${user.username.split(' ')[0]}?`}
            value={content}
            onChange={e => setContent(e.target.value)}
            className="resize-none min-h-[80px] focus-visible:ring-[#1877F2]"
          />

          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {imagePreviews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-md overflow-hidden"
                >
                  <img
                    src={url}
                    alt={`preview-${idx}`}
                    className="w-full h-32 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Video previews */}
          {videoPreviews.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {videoPreviews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-md overflow-hidden"
                >
                  <video
                    src={url}
                    controls
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeVideo(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Action row: wrap buttons nicely on small screens */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-gray-200 space-y-2 sm:space-y-0">
            <div className="flex flex-wrap gap-2">
              <Input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center text-gray-600"
                disabled={isSubmitting}
              >
                <ImageIcon className="h-4 w-4 mr-1 text-[#45BD62]" /> Photo
              </Button>

              <Input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={handleVideoChange}
                id="video-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center text-gray-600"
                disabled={isSubmitting}
              >
                <VideoIcon className="h-4 w-4 mr-1 text-[#F3425F]" /> Video
              </Button>
            </div>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (!content.trim() &&
                  imageFiles.length === 0 &&
                  videoFiles.length === 0)
              }
              className="bg-[#1877F2] hover:bg-[#166FE5] w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  </CardContent>
</Card>

  );
}
