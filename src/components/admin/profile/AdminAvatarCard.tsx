import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import { AdminMe, uploadAdminAvatar } from '@/services/adminProfile';

function initials(name?: string) {
    if (!name) return 'A';
    const parts = name.split(' ');
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function AdminAvatarCard({
    me,
    onUpdated,
}: {
    me: AdminMe;
    onUpdated: (u: AdminMe) => void;
}) {
    const {accessToken} = useAuth();
  const headers = useAuthHeader(accessToken);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pick = () => inputRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const onSave = async () => {
    const f = inputRef.current?.files?.[0];
    if (!f) return toast.error('Please choose an image first');
    setSaving(true);
    try {
      const url = await uploadAdminAvatar(f, headers);
      onUpdated({ ...me, profileImage: url });
      toast.success('Avatar updated');
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (e:any) {
      toast.error('Upload failed', { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const current = preview || me.profileImage || '';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {current ? (
            <AvatarImage src={current} alt={me.username} />
          ) : (
            <AvatarFallback>{initials(me.username)}</AvatarFallback>
          )}
        </Avatar>
        <div className="space-x-2">
          <Button variant="outline" onClick={pick}>Choose image</Button>
          <Button onClick={onSave} disabled={!preview || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
      </div>
      {preview && <p className="text-xs text-gray-500">Preview shown. Click “Save” to upload.</p>}
    </div>
  );
}
