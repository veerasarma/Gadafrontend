import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { changeAdminPassword } from '@/services/adminProfile';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminPasswordForm() {
    const {accessToken} = useAuth();
    const headers = useAuthHeader(accessToken);
    const [oldPassword, setOld] = useState('');
    const [newPassword, setNew] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    setSaving(true);
    try {
      await changeAdminPassword(oldPassword, newPassword, headers);
      toast.success('Password changed');
      setOld(''); setNew('');
    } catch (e:any) {
      toast.error('Failed', { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>Old password</Label>
        <Input type="password" value={oldPassword} onChange={e=>setOld(e.target.value)} />
      </div>
      <div>
        <Label>New password</Label>
        <Input type="password" value={newPassword} onChange={e=>setNew(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Change password'}</Button>
      </div>
    </div>
  );
}
