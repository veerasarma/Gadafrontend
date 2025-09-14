// src/components/profile/ProfileImageUpload.tsx  (DROP-IN)
import { useState, ChangeEvent, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadAvatar } from '@/services/userServices';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthHeaderupload } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileImageUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageUrl: string) => void;
  /** Optional: profile | cover, used by your upload endpoint */
  title: string;
  type: 'profile' | 'cover' | string;
  description: string;
  /** Optional: notify parent page to show a big overlay loader */
  onUploadingChange?: (loading: boolean) => void;
}

export function ProfileImageUpload({
  isOpen,
  onClose,
  onSave,
  title,
  type,
  description,
  onUploadingChange,
}: ProfileImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const headersUpload = useAuthHeaderupload(accessToken); // ✅ hook at top level
  const navigate = useNavigate();

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedFile || !id) return;
    setLoading(true);
    onUploadingChange?.(true);
    setError(null);
    try {
      const avatarPath = await uploadAvatar(id, selectedFile, headersUpload, type);
      onSave(avatarPath);                 // let parent update UI immediately
      setPreviewUrl(avatarPath);          // keep preview in modal just in case
      onClose();                          // close modal on success
      navigate('/profile/' + id);
    } catch (err: any) {
      console.error('Avatar upload failed', err);
      setError(err?.message || 'Upload failed');
    } finally {
      setLoading(false);
      onUploadingChange?.(false);
      if (fileRef.current) fileRef.current.value = ''; // allow re-selecting same file
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload an image</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              ref={fileRef}
              onChange={handleFileInput}
            />
          </div>

          {previewUrl && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="relative w-full max-w-[200px] h-[200px] mx-auto rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedFile || loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading…</> : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
