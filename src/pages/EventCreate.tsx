import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import EventSidebar from '@/components/events/eventsidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeaderupload } from '@/hooks/useAuthHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { listEventCategories, createEvent } from '@/services/eventsService';
import { useNavigate } from 'react-router-dom';

export default function EventCreate() {
  const { accessToken } = useAuth();
  const headers = useAuthHeaderupload(accessToken);
  const headersRef = useRef(headers);
  useEffect(()=>{ headersRef.current = headers; }, [headers]);

  const [cats, setCats] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [countryId, setCountryId] = useState<number>(161); // default
  const [categoryId, setCategoryId] = useState<number>(16);
  const [privacy, setPrivacy] = useState<'public'|'closed'|'secret'>('public');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [ticketsLink, setTicketsLink] = useState('');
  const [prices, setPrices] = useState('');
  const [cover, setCover] = useState<File|null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!accessToken) return;
    listEventCategories(headersRef.current).then(setCats).catch(()=>{});
  }, [accessToken]);

  const onSubmit = async () => {
    if (!title.trim() || !desc.trim() || !startAt || !endAt || !categoryId) return;
    setBusy(true);
    try {
      const id = await createEvent({
        title, description: desc, location, countryId, categoryId, privacy,
        startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString(),
        ticketsLink: ticketsLink || null, prices: prices || null
      }, cover, headersRef.current);
      nav(`/events/${id}`);
    } catch (e) {
      console.error(e);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <EventSidebar highlight="create" cats={cats}/>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="text-lg font-semibold">Create Event</div>
            <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" />
            <Textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location" />
              <Input value={countryId} onChange={e=>setCountryId(Number(e.target.value)||161)} placeholder="Country ID" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select className="border rounded px-2 py-2 bg-white" value={categoryId} onChange={e=>setCategoryId(Number(e.target.value))}>
                {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
              <select className="border rounded px-2 py-2 bg-white" value={privacy} onChange={e=>setPrivacy(e.target.value as any)}>
                <option value="public">Public</option>
                <option value="closed">Closed</option>
                <option value="secret">Secret</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input type="datetime-local" value={startAt} onChange={e=>setStartAt(e.target.value)} />
              <Input type="datetime-local" value={endAt} onChange={e=>setEndAt(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={ticketsLink} onChange={e=>setTicketsLink(e.target.value)} placeholder="Tickets link (optional)" />
              <Input value={prices} onChange={e=>setPrices(e.target.value)} placeholder="Prices (optional)" />
            </div>

            <div>
              <input type="file" accept="image/*" onChange={e=>setCover(e.target.files?.[0] || null)} />
            </div>

            <div className="flex justify-end">
              <Button onClick={onSubmit} disabled={busy || !title.trim() || !desc.trim() || !startAt || !endAt}>
                {busy ? 'Creating…' : 'Create Event'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
