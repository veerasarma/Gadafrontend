import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { listMyGroupInvites, fetchGroupCategories, acceptGroupInvite, declineGroupInvite } from '@/services/groupsService';
import { Button } from '@/components/ui/button';
import { Loader2, FilePlus2, Inbox } from 'lucide-react';
import GroupsSidebar from '@/components/groups/groupsidebar';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export default function GroupsInvites() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  const nav = useNavigate();

  const [cats, setCats] = useState<any[]>([]);
  const [invCount, setInvCount] = useState(0);

  const [items, setItems] = useState<any[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const refreshInvites = () =>
    listMyGroupInvites(headersRef.current)
      .then((arr) => { setItems(arr); setInvCount(arr.length); })
      .catch(console.error);

  useEffect(() => {
    if (!accessToken) return;
    setItems(null);
    refreshInvites();
    fetchGroupCategories(headersRef.current).then(setCats).catch(() => {});
  }, [accessToken]);

  const onAccept = async (groupName: string, inviteId: number) => {
    setBusy(inviteId);
    try { await acceptGroupInvite(groupName, inviteId, headersRef.current); await refreshInvites(); }
    finally { setBusy(null); }
  };
  const onDecline = async (groupName: string, inviteId: number) => {
    setBusy(inviteId);
    try { await declineGroupInvite(groupName, inviteId, headersRef.current); await refreshInvites(); }
    finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="col-span-12 md:col-span-3">
          <GroupsSidebar/>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="col-span-12 md:col-span-9">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xl font-semibold mb-3">Group Invites</div>

            {items === null ? (
              <div className="text-gray-500"><Loader2 className="inline h-4 w-4 animate-spin" /> Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-gray-500">No invites</div>
            ) : (
              <ul className="divide-y">
                {items.map(inv => (
                  <li key={inv.inviteId} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                        {inv.group_picture && <img src={`${API_BASE_URL}/uploads/${inv.group_picture}`} className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{inv.group_title}</div>
                        <div className="text-xs text-gray-500 truncate">@{inv.group_name} • invited by {inv.fromUsername}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => onAccept(inv.group_name, inv.inviteId)} disabled={busy===inv.inviteId}>
                        {busy===inv.inviteId ? '...' : 'Accept'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onDecline(inv.group_name, inv.inviteId)} disabled={busy===inv.inviteId}>
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
