import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthHeader,useAuthHeaderupload } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import { AdminMe, updateAdminProfile } from '@/services/adminProfile';

export default function AdminProfileForm({
    me,
    onUpdated,
}: {
    me: AdminMe;
    onUpdated: (updated: AdminMe) => void;
}) {
    const {accessToken} = useAuth();
  const headers = useAuthHeaderupload(accessToken);
  console.log(headers,'headersheaders')
  const [form, setForm] = useState({
    username: me.username || '',
    firstname: me.firstname || '',
    lastname: me.lastname || '',
    email: me.email || '',
    bio: me.bio || '',
    timezone: me.timezone || '',
  });
  const [saving, setSaving] = useState(false);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setForm(s => ({ ...s, [k]: e.target.value }));

  const onSave = async () => {
    setSaving(true);
    try {
      await updateAdminProfile(form, headers);
      onUpdated({ ...me, ...form });
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error('Update failed', { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>Username</Label>
        <Input value={form.username} onChange={onChange('username')} />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={form.email} onChange={onChange('email')} type="email" />
      </div>
      <div>
        <Label>First name</Label>
        <Input value={form.firstname} onChange={onChange('firstname')} />
      </div>
      <div>
        <Label>Last name</Label>
        <Input value={form.lastname} onChange={onChange('lastname')} />
      </div>
      <div className="sm:col-span-2">
        <Label>Bio</Label>
        <Textarea value={form.bio} onChange={onChange('bio')} rows={3} />
      </div>
      <div className="sm:col-span-2">
        <Label>Timezone</Label>
        <Input value={form.timezone} onChange={onChange('timezone')} placeholder="e.g. Asia/Kolkata" />
      </div>
      <div className="sm:col-span-2">
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
