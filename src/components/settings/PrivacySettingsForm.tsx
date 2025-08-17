// src/components/settings/PrivacySettingsForm.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { getPrivacy, updatePrivacy, type PrivacySettings } from '@/services/settingsService';

function PrivacySettingsForm() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [data, setData] = useState<PrivacySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getPrivacy(headers).then(setData).catch(console.error);
  }, [accessToken]);

  if (!data) return <div className="p-4">Loading…</div>;

  const save = async () => {
    setSaving(true);
    try {
      await updatePrivacy(data, headers);
    } finally { setSaving(false); }
  };

  return (
    <Card className="mb-6">
      <CardHeader><CardTitle>Privacy</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Profile visibility</Label>
            <select
              className="w-full border rounded-md h-10 px-3 mt-1"
              value={data.profileVisibility}
              onChange={e=>setData({ ...data, profileVisibility: e.target.value as any })}
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends</option>
              <option value="only_me">Only me</option>
            </select>
          </div>
          <div>
            <Label>Who can send you friend requests</Label>
            <select
              className="w-full border rounded-md h-10 px-3 mt-1"
              value={data.friendRequestPolicy}
              onChange={e=>setData({ ...data, friendRequestPolicy: e.target.value as any })}
            >
              <option value="everyone">Everyone</option>
              <option value="friends_of_friends">Friends of friends</option>
            </select>
          </div>
          <div>
            <Label>Who can look you up by email</Label>
            <select
              className="w-full border rounded-md h-10 px-3 mt-1"
              value={data.lookupEmail}
              onChange={e=>setData({ ...data, lookupEmail: e.target.value as any })}
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends</option>
              <option value="only_me">Only me</option>
            </select>
          </div>
          <div>
            <Label>Who can look you up by phone</Label>
            <select
              className="w-full border rounded-md h-10 px-3 mt-1"
              value={data.lookupPhone}
              onChange={e=>setData({ ...data, lookupPhone: e.target.value as any })}
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends</option>
              <option value="only_me">Only me</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={data.showOnline} onCheckedChange={(v)=>setData({ ...data, showOnline: v })} />
            <Label>Show online status</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={data.tagReview} onCheckedChange={(v)=>setData({ ...data, tagReview: v })} />
            <Label>Require review before tags appear</Label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}


export { PrivacySettingsForm };