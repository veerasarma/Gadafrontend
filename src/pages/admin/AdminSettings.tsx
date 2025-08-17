import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllAdminSettings, updateAdminSection, type AdminSettings } from '@/services/adminSettings';

type SectionKey = keyof AdminSettings;

export default function AdminSettings() {
  const {accessToken} = useAuth();
  const headers = useAuthHeader(accessToken);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [tab, setTab] = useState<SectionKey>('general');
  const ready = useMemo(() => 'Authorization' in headers, [headers]);

  useEffect(() => {
    if (!ready) return;
    fetchAllAdminSettings(headers)
      .then(setSettings)
      .catch(e => toast.error('Failed to load settings', { description: e.message }));
  }, [ready]);

  if (!settings) {
    return <div className="bg-white rounded-lg shadow p-6">Loading settings…</div>;
  }

  const save = async (section: SectionKey, data: Record<string, any>) => {
    try {
      await updateAdminSection(section, data, headers);
      setSettings(prev => (prev ? { ...prev, [section]: { ...data } } : prev));
      toast.success('Saved', { description: `Updated ${section} settings.` });
    } catch (e: any) {
      toast.error('Save failed', { description: e?.message });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border h-full overflow-hidden flex flex-col">
      {/* IMPORTANT: Tabs wraps BOTH the header and the content */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as SectionKey)}
        className="flex h-full flex-col"
      >
        {/* Sticky tab header inside the card */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
          <div className="px-3 sm:px-4 md:px-6">
            <TabsList
              className="
                !bg-transparent p-0 h-auto
                w-full md:w-auto
                flex flex-wrap md:flex-nowrap gap-2 items-end
                overflow-x-auto hide-scrollbar
                border-b-0
              "
            >
              {(['general','features','moderation','storage','email','security'] as SectionKey[]).map((k) => (
                <TabsTrigger
                  key={k}
                  value={k}
                  className="
                    rounded-md
                    px-3 md:px-4 py-2
                    text-sm font-medium whitespace-nowrap
                    text-gray-600
                    data-[state=active]:text-gray-900
                    data-[state=active]:bg-white
                    data-[state=active]:border
                  "
                >
                  {k[0].toUpperCase() + k.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 pt-6">
          {/* GENERAL */}
          <TabsContent value="general" className="m-0">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Site Name</Label>
                <Input defaultValue={settings.general?.siteName || ''} id="siteName" />
              </div>
              <div>
                <Label>Site URL</Label>
                <Input defaultValue={settings.general?.siteUrl || ''} id="siteUrl" />
              </div>
              <div className="flex items-center space-x-3">
                <Switch defaultChecked={!!settings.general?.allowSignups} id="allowSignups" />
                <Label htmlFor="allowSignups">Allow new signups</Label>
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => {
                  const siteName = (document.getElementById('siteName') as HTMLInputElement)?.value;
                  const siteUrl = (document.getElementById('siteUrl') as HTMLInputElement)?.value;
                  const allowSignups = (document.getElementById('allowSignups') as HTMLInputElement)?.checked;
                  save('general', { siteName, siteUrl, allowSignups });
                }}
              >
                Save
              </Button>
            </div>
          </TabsContent>

          {/* FEATURES */}
          <TabsContent value="features" className="m-0">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ['stories', 'Stories'],
                ['reels', 'Reels'],
                ['groups', 'Groups'],
                ['payments', 'Payments'],
              ].map(([k, label]) => (
                <div key={k} className="flex items-center space-x-3">
                  <Switch id={`f-${k}`} defaultChecked={!!(settings.features as any)?.[k]} />
                  <Label htmlFor={`f-${k}`}>{label}</Label>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button
                onClick={() => {
                  const stories  = (document.getElementById('f-stories') as HTMLInputElement)?.checked;
                  const reels    = (document.getElementById('f-reels') as HTMLInputElement)?.checked;
                  const groups   = (document.getElementById('f-groups') as HTMLInputElement)?.checked;
                  const payments = (document.getElementById('f-payments') as HTMLInputElement)?.checked;
                  save('features', { stories, reels, groups, payments });
                }}
              >
                Save
              </Button>
            </div>
          </TabsContent>

          {/* MODERATION */}
          <TabsContent value="moderation" className="m-0">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Max Post Length</Label>
                <Input type="number" defaultValue={settings.moderation?.maxPostLength ?? 5000} id="maxPostLength" />
              </div>
              <div>
                <Label>Bad Words (comma separated)</Label>
                <Input defaultValue={(settings.moderation?.badWords || []).join(', ')} id="badWords" />
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => {
                  const maxPostLength = Number((document.getElementById('maxPostLength') as HTMLInputElement)?.value) || 5000;
                  const badWords = (document.getElementById('badWords') as HTMLInputElement)?.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  save('moderation', { maxPostLength, badWords });
                }}
              >
                Save
              </Button>
            </div>
          </TabsContent>

          {/* STORAGE */}
          <TabsContent value="storage" className="m-0">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Max upload (MB)</Label>
                <Input type="number" defaultValue={settings.storage?.maxUploadMB ?? 20} id="maxUploadMB" />
              </div>
              <div>
                <Label>Allowed Image MIME (comma separated)</Label>
                <Textarea defaultValue={(settings.storage?.allowedImageMime || []).join(', ')} id="imgMime" />
              </div>
              <div className="sm:col-span-2">
                <Label>Allowed Video MIME (comma separated)</Label>
                <Textarea defaultValue={(settings.storage?.allowedVideoMime || []).join(', ')} id="vidMime" />
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => {
                  const maxUploadMB = Number((document.getElementById('maxUploadMB') as HTMLInputElement)?.value) || 20;
                  const imgMime = (document.getElementById('imgMime') as HTMLTextAreaElement)?.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const vidMime = (document.getElementById('vidMime') as HTMLTextAreaElement)?.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  save('storage', { maxUploadMB, allowedImageMime: imgMime, allowedVideoMime: vidMime });
                }}
              >
                Save
              </Button>
            </div>
          </TabsContent>

          {/* EMAIL */}
          <TabsContent value="email" className="m-0">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>From Name</Label>
                <Input defaultValue={settings.email?.fromName || ''} id="fromName" />
              </div>
              <div>
                <Label>From Email</Label>
                <Input defaultValue={settings.email?.fromEmail || ''} id="fromEmail" />
              </div>
              <div>
                <Label>SMTP Host</Label>
                <Input defaultValue={settings.email?.smtpHost || ''} id="smtpHost" />
              </div>
              <div>
                <Label>SMTP Port</Label>
                <Input type="number" defaultValue={settings.email?.smtpPort ?? 587} id="smtpPort" />
              </div>
              <div>
                <Label>SMTP User</Label>
                <Input defaultValue={settings.email?.smtpUser || ''} id="smtpUser" />
              </div>
              <div>
                <Label>SMTP Password</Label>
                <Input type="password" defaultValue={settings.email?.smtpPassword || ''} id="smtpPassword" />
                <p className="text-xs text-gray-500 mt-1">
                  If you see ********, leaving it unchanged will keep the existing secret.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => {
                  const fromName = (document.getElementById('fromName') as HTMLInputElement)?.value;
                  const fromEmail = (document.getElementById('fromEmail') as HTMLInputElement)?.value;
                  const smtpHost = (document.getElementById('smtpHost') as HTMLInputElement)?.value;
                  const smtpPort = Number((document.getElementById('smtpPort') as HTMLInputElement)?.value) || 587;
                  const smtpUser = (document.getElementById('smtpUser') as HTMLInputElement)?.value;
                  const smtpPassword = (document.getElementById('smtpPassword') as HTMLInputElement)?.value;
                  save('email', { fromName, fromEmail, smtpHost, smtpPort, smtpUser, smtpPassword });
                }}
              >
                Save
              </Button>
            </div>
          </TabsContent>

          {/* SECURITY */}
          <TabsContent value="security" className="m-0">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>CORS Origins (one per line)</Label>
                <Textarea id="corsOrigins" defaultValue={(settings.security?.corsOrigins || []).join('\n')} rows={5} />
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => {
                  const corsOrigins = (document.getElementById('corsOrigins') as HTMLTextAreaElement)
                    ?.value.split('\n').map((s) => s.trim()).filter(Boolean);
                  save('security', { corsOrigins });
                }}
              >
                Save
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
