// src/components/settings/GeneralSettingsForm.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { getGeneral, updateGeneral, type GeneralSettings } from '@/services/settingsService';
import { Separator } from '@/components/ui/separator';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { toast } from 'sonner';

 function GeneralSettingsForm() {
  const { accessToken, user } = useAuth();
//   const { toast } = useToast();
  const headers = useAuthHeader(accessToken);
  const [data, setData] = useState<GeneralSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getGeneral(headers).then(setData).catch(console.error);
    console.log(data,'datadata')
  }, [accessToken]);

  const onSave = async () => {

    if (!data) return;
    setSaving(true);
    try {
      await updateGeneral(data, headers);
      toast.success("Your settings were updated successfully")
      // Optionally: toast('Saved')
    } catch (e) {
      console.error(e);
      toast.error( e?.message || "Something went wrong. Please try again.")
     
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div className="p-4">Loading…</div>;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>General</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
         {/* {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )} */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       
          <div>
            <Label>Username</Label>
            <Input value={data.username} disabled required/>
          </div>
          <div>
            <Label>Email</Label>
            <Input value={data.user_email} disabled required/>
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={data.phone ?? ''} onChange={e=>setData({ ...data, phone: e.target.value })} required/>
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input type="date" value={data.dateOfBirth ?? ''} onChange={e=>setData({ ...data, dateOfBirth: e.target.value })} required/>
          </div>
          <div>
            <Label>Gender</Label>
            <select
              className="w-full border rounded-md h-10 px-3"
              value={data.gender ?? ''}
              onChange={e=>setData({ ...data, gender: e.target.value as any })}
              required>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
              <option value="prefer_not">Prefer not to say</option>
            </select>
          </div>
          <div>
            <Label>Website</Label>
            <Input value={data.website ?? ''} onChange={e=>setData({ ...data, website: e.target.value })} required/>
          </div>
          <div>
            <Label>City</Label>
            <Input value={data.city ?? ''} onChange={e=>setData({ ...data, city: e.target.value })} required/>
          </div>
          <div>
            <Label>Country</Label>
            <Input value={data.country ?? ''} onChange={e=>setData({ ...data, country: e.target.value })} required/>
          </div>
          <div>
            <Label>Timezone</Label>
            <Input value={data.timezone ?? 'UTC'} onChange={e=>setData({ ...data, timezone: e.target.value })} required/>
          </div>
          <div>
            <Label>Language</Label>
            <Input value={data.language ?? 'en'} onChange={e=>setData({ ...data, language: e.target.value })} required/>
          </div>
          <div className="md:col-span-2">
            <Label>Work</Label>
            <Input value={data.work ?? ''} onChange={e=>setData({ ...data, work: e.target.value })} required/>
          </div>
          <div className="md:col-span-2">
            <Label>Education</Label>
            <Input value={data.education ?? ''} onChange={e=>setData({ ...data, education: e.target.value })} required/>
          </div>
        </div>

        <Separator />
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { GeneralSettingsForm };
