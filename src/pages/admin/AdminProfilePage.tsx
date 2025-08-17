import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminMe, AdminMe } from '@/services/adminProfile';
import AdminProfileForm from '@/components/admin/profile/AdminProfileForm';
import AdminAvatarCard from '@/components/admin/profile/AdminAvatarCard';
import AdminPasswordForm from '@/components/admin/profile/AdminPasswordForm';
import AdminSessionsTable from '@/components/admin/profile/AdminSessionsTable';

type TTab = 'profile' | 'avatar' | 'password' | 'sessions';

export default function AdminProfilePage() {
  const {accessToken} = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => 'Authorization' in headers, [headers]);
  const [me, setMe] = useState<AdminMe | null>(null);
  const [tab, setTab] = useState<TTab>('profile');

  useEffect(() => {
    if (!ready) return;
    getAdminMe(headers)
      .then(setMe)
      .catch(e => toast.error('Failed to load admin profile', { description: e.message }));
  }, [ready]);

  if (!me) {
    return <div className="bg-white rounded-lg shadow p-6">Loading…</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border h-full overflow-hidden flex flex-col">
      <Tabs value={tab} onValueChange={(v)=>setTab(v as TTab)} className="flex flex-col h-full">
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
          <div className="px-3 sm:px-4 md:px-6">
            <TabsList className="!bg-transparent p-0 h-auto w-full flex flex-wrap gap-2 overflow-x-auto">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="avatar">Avatar</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6">
          <TabsContent value="profile" className="m-0">
            <AdminProfileForm me={me} onUpdated={setMe} />
          </TabsContent>

          <TabsContent value="avatar" className="m-0">
            <AdminAvatarCard me={me} onUpdated={setMe} />
          </TabsContent>

          <TabsContent value="password" className="m-0">
            <AdminPasswordForm />
          </TabsContent>

          <TabsContent value="sessions" className="m-0">
            <AdminSessionsTable />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
