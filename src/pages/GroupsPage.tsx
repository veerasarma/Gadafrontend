// src/pages/groups/GroupsPage.tsx
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import GroupCard from '@/components/groups/GroupCard';
import { fetchGroups, joinGroup, leaveGroup, type Group } from '@/services/groupService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { toast } from 'sonner';

type Tab = 'discover'|'joined'|'mine';

export default function GroupsPage() {
  const [tab, setTab] = useState<Tab>('discover');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Group[]>([]);
  const [cursor, setCursor] = useState<number|null>(0);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
// console.log(headers,'headersheadersheadersheaders')
  const load = async (reset=false) => {
    setLoading(true);
    try {
      const res = await fetchGroups(headers, { tab, q, cursor: reset ? 0 : cursor, limit: 12 });
      setItems(prev => reset ? res.items : [...prev, ...res.items]);
      setCursor(res.nextCursor);
    } catch (e:any) {
      toast.error(e?.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(true); /* eslint-disable-next-line */ }, [accessToken]);

  const onSearch = (e: React.FormEvent) => { e.preventDefault(); load(true); };

  const onJoin = async (id: number) => {
    try {
      await joinGroup(headers, id);
      toast.success('Request sent');
      setItems(prev => prev.map(g => g.group_id===id ? { ...g, joined:'1' } : g));
    } catch (e:any) { toast.error(e?.message || 'Join failed'); }
  };

  const onLeave = async (id: number) => {
    try {
      await leaveGroup(headers, id);
      toast.success('Left group');
      setItems(prev => prev.map(g => g.group_id===id ? { ...g, joined:'0', approved:'0' } : g));
    } catch (e:any) { toast.error(e?.message || 'Leave failed'); }
  };

  return (
    <div className="flex flex-col h-screen bg-cus">
      <Navbar />

      <div className="flex flex-1 overflow-hidden px-4 lg:px-8">
        <div className="flex w-full max-w-[1600px] mx-auto gap-6">
          {/* LEFT: normal sidebar */}
          <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto">
            <div className="sticky top-16"><Sidebar /></div>
          </aside>

          {/* CENTER: groups */}
          <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-5xl 2xl:max-w-6xl mx-auto">
            {/* <div className="bg-white rounded-xl shadow-sm border h-full overflow-hidden"> */}
              {/* Hero */}
              <div className="rounded-xl p-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <h1 className="text-2xl font-bold">Groups</h1>
                <p className="opacity-90">Discover groups</p>
              </div>
              

              {/* Tabs header */}
              <div className="px-4 md:px-6 border-b sticky top-16 bg-white z-10">
                <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
                  <TabsList className="!bg-transparent p-0 h-12 gap-2">
                    <TabsTrigger value="discover">Discover</TabsTrigger>
                    <TabsTrigger value="joined">Joined Groups</TabsTrigger>
                    <TabsTrigger value="mine">My Groups</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Search + grid */}
              <div className="p-4 md:p-6">
                <form onSubmit={onSearch} className="flex gap-3 mb-4">
                  <Input
                    placeholder="Search for groups"
                    value={q}
                    onChange={(e)=>setQ(e.target.value)}
                  />
                  <Button type="submit">Search</Button>
                </form>

                {items.length === 0 ? (
                  <div className="py-16 text-center text-gray-500">No data to show</div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map(g => (
                      <GroupCard key={g.group_id} g={g} onJoin={onJoin} onLeave={onLeave}/>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-center">
                  {cursor != null ? (
                    <Button onClick={()=>load()} disabled={loading}>
                      {loading ? 'Loading…' : 'Load more'}
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500">You’ve reached the end</p>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT: empty for now */}
         
        </div>
      </div>
    </div>
  );
}
