import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import EventSidebar from '@/components/events/eventsidebar';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarDays, MapPin, Link2,UserPlus, X } from 'lucide-react';
import { getEvent, rsvpEvent, getEventMembers, updateEventCover,inviteToEvent, suggestUsers } from '@/services/eventsService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export default function EventView() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(()=>{ headersRef.current = headers; }, [headers]);

  const [summary, setSummary] = useState<any|null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<any[]|null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
const [query, setQuery] = useState('');
const [suggest, setSuggest] = useState<any[]>([]);
const [inviteBusy, setInviteBusy] = useState<number | null>(null);


  const isAdmin = !!summary?.admins?.some((a:any)=>String(a.id)===String(user?.id))
               || String(summary?.event?.adminId) === String(user?.id);

  useEffect(() => {
    if (!accessToken || !id) return;
    let cancel = false;
    setLoading(true);
    getEvent(id, headersRef.current)
      .then(d => !cancel && setSummary(d))
      .catch(console.error)
      .finally(()=> !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [accessToken, id]);

  useEffect(() => {
    if (!accessToken || !id) return;
    getEventMembers(id, headersRef.current).then(setMembers).catch(()=>setMembers([]));
  }, [accessToken, id]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!inviteOpen || !query.trim()) { setSuggest([]); return; }
      suggestUsers(query.trim(), headersRef.current)
        .then(setSuggest)
        .catch(() => setSuggest([]));
    }, 250);
    return () => clearTimeout(t);
  }, [inviteOpen, query]);

  const doRSVP = async (status: 'interested'|'going'|'none') => {
    if (!id || busy) return;
    setBusy(true);
    try {
      await rsvpEvent(id, status, headersRef.current);
      const fresh = await getEvent(id, headersRef.current);
      setSummary(fresh);
      const m = await getEventMembers(id, headersRef.current);
      setMembers(m);
    } finally { setBusy(false); }
  };

  function removeByUserIdInPlace(list, userId) {
    const idStr = String(userId);
    const i = list.findIndex(item => String(item.id) === idStr);
    if (i !== -1) list.splice(i, 1);
  }
  

  const sendInvite = async (toUserId: number) => {
    if (!id) return;
    setInviteBusy(toUserId);
    try {
      await inviteToEvent(id, toUserId, headersRef.current);
      removeByUserIdInPlace(suggest, toUserId)
      // optional: give feedback, clear search
    //   setQuery('');
    //   setSuggest([]);
    } catch (e) {
      console.error(e);
    } finally {
      setInviteBusy(null);
    }
  };
  

  const onChangeCover = async (file?: File|null) => {
    if (!file || !id) return;
    try {
      const resp = await updateEventCover(id, file, headersRef.current);
      setSummary((prev:any)=> prev ? ({ ...prev, event: { ...prev.event, cover: resp.cover } }) : prev);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />

      {loading ? (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-10 text-gray-500">
          <Loader2 className="inline h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : !summary ? (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-10 text-gray-500">Event not found</div>
      ) : (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
          <aside className="col-span-12 md:col-span-3">
            <EventSidebar />
          </aside>

          <main className="col-span-12 md:col-span-9">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative h-48 sm:h-64 bg-gray-200">
                {summary.event.cover && (
                  <img src={`${API_BASE_URL}/uploads/${summary.event.cover}`} className="w-full h-full object-cover" />
                )}
                {isAdmin && (
                  <label className="absolute right-3 bottom-3 bg-white/80 rounded px-3 py-1 text-sm cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={(e)=>onChangeCover(e.target.files?.[0])}/>
                    Change cover
                  </label>
                    
                )}

              </div>

              <div className="px-4 sm:px-6 py-4">
                <div className="text-2xl font-bold">{summary.event.title}</div>
                <div className="text-gray-600 mt-1 flex flex-wrap gap-4">
                  <span className="inline-flex items-center"><CalendarDays className="h-4 w-4 mr-2"/>{new Date(summary.event.startAt).toLocaleString()} – {new Date(summary.event.endAt).toLocaleString()}</span>
                  {summary.event.location && <span className="inline-flex items-center"><MapPin className="h-4 w-4 mr-2"/>{summary.event.location}</span>}
                  {summary.event.ticketsLink && <a href={summary.event.ticketsLink} target="_blank" className="inline-flex items-center text-[#1877F2]"><Link2 className="h-4 w-4 mr-1"/> Tickets</a>}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button variant={summary.my?.interested ? 'default' : 'outline'} onClick={()=>doRSVP('interested')} disabled={busy}>
                    Interested
                  </Button>
                  <Button variant={summary.my?.going ? 'default' : 'outline'} onClick={()=>doRSVP('going')} disabled={busy}>
                    Going
                  </Button>
                  <Button variant="outline" onClick={() => setInviteOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" /> Invite people
                  </Button>
                  {(summary.my?.interested || summary.my?.going) && (
                    <Button variant="ghost" onClick={()=>doRSVP('none')} disabled={busy}>Remove response</Button>
                  )}
                  <div className="ml-auto text-sm text-gray-600">
                    {summary.event.stats.going} going · {summary.event.stats.interested} interested
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6 mt-6">
              <div className="col-span-12 lg:col-span-8 space-y-4">
                {summary.event.description && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="font-semibold mb-1">About</div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{summary.event.description}</div>
                  </div>
                )}

                {/* (Optional) Discussion feed could go here if you later wire event posts */}
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="font-semibold mb-2">Attendees</div>
                  {!members ? (
                    <div className="text-sm text-gray-500">Loading…</div>
                  ) : members.length === 0 ? (
                    <div className="text-sm text-gray-500">No attendees yet</div>
                  ) : (
                    <ul className="space-y-2">
                      {members.slice(0, 12).map(m => (
                        <li key={m.id} className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                            {m.avatar && <img src={`${API_BASE_URL}/uploads/${m.avatar}`} className="w-full h-full object-cover" />}
                          </div>
                          <div className="text-sm truncate">
                            {m.fullName || m.username}
                            {m.going ? <span className="text-xs text-green-600 ml-2">Going</span> : m.interested ? <span className="text-xs text-amber-600 ml-2">Interested</span> : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </main>
          {inviteOpen && (
  <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
    <div className="bg-white rounded-lg shadow w-full max-w-md p-4 relative">
      <button
        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
        onClick={() => { setInviteOpen(false); setQuery(''); setSuggest([]); }}
      >
        <X className="h-5 w-5" />
      </button>

      <div className="text-lg font-semibold mb-3">Invite people</div>

      <input
        className="w-full border rounded px-3 py-2 mb-3"
        placeholder="Search users…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="max-h-64 overflow-auto -mx-2 px-2">
        {suggest.length === 0 ? (
          <div className="text-sm text-gray-500">
            Type a name or username…
          </div>
        ) : (
          <ul className="divide-y">
            {suggest.map((u) => (
              <li key={u.id} className="py-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200">
                    {u.avatar && (
                      <img
                        src={`${API_BASE_URL}/uploads/${u.avatar}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {u.fullName || u.username}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      @{u.username}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => sendInvite(Number(u.id))}
                  disabled={inviteBusy === Number(u.id)}
                >
                  {inviteBusy === Number(u.id) ? '...' : 'Invite'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
)}
        </div>
      )}
    </div>
  );
}
