// src/components/settings/NotificationSettingsForm.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { getNotifications, updateNotifications, type NotificationSettings } from '@/services/settingsService';

function NotificationSettingsForm() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [data, setData] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getNotifications(headers).then(setData).catch(console.error);
  }, [accessToken]);

  if (!data) return <div className="p-4">Loading…</div>;

  const toggle = (key: keyof NotificationSettings) =>
    setData(prev => prev ? ({ ...prev, [key]: !prev[key] }) : prev);

  const save = async () => {
    setSaving(true);
    try {
      await updateNotifications(data!, headers);
    } finally { setSaving(false); }
  };

  return (
    <Card className="mb-6">
      <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            ['inappLikes','Likes'],
            ['inappComments','Comments'],
            ['inappMentions','Mentions'],
            ['inappFriendRequests','Friend requests'],
            ['inappGroupActivity','Group activity'],
            ['inappPayments','Payments'],
            ['emailDigest','Email weekly digest'],
            ['emailSecurity','Email security alerts'],
          ] as [keyof NotificationSettings, string][]).map(([k, label]) => (
            <div key={k} className="flex items-center gap-3">
              <Switch checked={data[k]} onCheckedChange={()=>toggle(k)} />
              <Label>{label}</Label>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
export { NotificationSettingsForm };
