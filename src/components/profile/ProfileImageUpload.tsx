import { useState, ChangeEvent,useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadAvatar } from '@/services/userServices';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthHeaderupload } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileImageUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageUrl: string) => void;
  title: string;
  type:string;
  description: string;
}

export function ProfileImageUpload({ isOpen, onClose, onSave, title,type, description }: ProfileImageUploadProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { id } = useParams<{ id: string }>();
  const {accessToken} = useAuth();  
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    console.log(objectUrl,'e.target.value')
    // setImageUrl(objectUrl);
    setLocalFile(null);
    setLocalImageUrl(objectUrl);
    setError(null);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File is too large. Maximum size is 5MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.');
        return;
      }
      
      setLocalFile(file);
      const url = URL.createObjectURL(file);
      setLocalImageUrl(url);
      setImageUrl('');
      setError(null);
    }
  };
  

  const handleFileSelect = async () => {

    if (!selectedFile) return;
    try {
      const headers = useAuthHeaderupload(accessToken);
      const avatarPath = await uploadAvatar(id, selectedFile,headers,type);
      onSave(avatarPath);
      setLocalImageUrl(avatarPath);
      navigate('/profile/'+id)
    } catch (err) {
      console.error('Avatar upload failed', err);
      // you might show a toast here
    } finally {
      // setLoading(false);
      e.target.value = ''; // allow re-selecting same file
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
          
          {/* <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              placeholder="/images/exampleimage.jpg"
              value={imageUrl}
              onChange={handleUrlChange}
            />
          </div> */}
          
          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload an image</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              ref={fileRef}
              onChange={handleUrlChange}
              value={imageUrl}
            />
          </div>
          
          {localImageUrl && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="relative w-full max-w-[200px] h-[200px] mx-auto rounded-md overflow-hidden">
                <img 
                  src={localImageUrl} 
                  alt="Preview" 
                  className="object-cover w-full h-full" 
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleFileSelect}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}