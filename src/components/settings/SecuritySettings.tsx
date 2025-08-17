// src/components/settings/SecuritySettings.tsx
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { changePassword, getSessions, revokeSession, type SessionRow } from '@/services/settingsService';
import { useToast } from "@/components/ui/use-toast";

export default function SecuritySettings() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [busy, setBusy] = useState(false);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!accessToken) return;
    getSessions(headers).then(setSessions).catch(console.error).finally(()=>setLoadingSessions(false));
  }, [accessToken]);

  const onChangePassword = async () => {
    setBusy(true);
    try {
      let result = await changePassword(currentPassword, newPassword, headers);
      console.log(result,'resultresultresult')
      setCurrentPassword(''); setNewPassword('');
      toast({
        title: "Saved",
        description: "Your settings were updated successfully.",
      });
      // toast success
    } catch (e) {
      console.error(e,'dfdsfdsfsdf');
      console.error(e.errors,'dfdsfdsfsdf');
      console.error(e.message,'dfdsfdsfsdf');
    //   console.error(e,'dfdsfdsfsdf');
    //   console.error(e,'dfdsfdsfsdf');
      toast({
        variant: "destructive",
        title: "Save failed",
        description: e?.path?.msg || "Something went wrong. Please try again.",
      });
    } finally { setBusy(false); }
  };

  const onRevoke = async (id: string) => {
    await revokeSession(id, headers).catch(console.error);
    setSessions(s => s.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Current password</Label>
            <Input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <Label>New password</Label>
            <Input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={onChangePassword} disabled={busy || !currentPassword || newPassword.length < 8}>
              {busy ? 'Saving…' : 'Change password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
        <CardContent>
          {loadingSessions ? (
            <div>Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="text-gray-500">No active sessions.</div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between border rounded-md p-3 bg-white">
                  <div className="text-sm">
                    <div className="font-medium">{s.userAgent || 'Unknown device'}</div>
                    <div className="text-gray-500">
                      IP {s.ip || '—'} • Created {new Date(s.createdAt).toLocaleString()}
                      {s.lastSeen && <> • Last seen {new Date(s.lastSeen).toLocaleString()}</>}
                    </div>
                  </div>
                  <Button variant="outline" onClick={()=>onRevoke(s.id)}>Revoke</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
