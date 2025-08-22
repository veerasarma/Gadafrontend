import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import EventSidebar from '@/components/events/eventsidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { listMyEventInvites } from '@/services/eventsService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export default function EventsInvites() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(()=>{ headersRef.current = headers; }, [headers]);

  const [items, setItems] = useState<any[]|null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listMyEventInvites(headersRef.current).then(setItems).catch(()=>setItems([]));
  }, [accessToken]);

  return (
    <div className="min-h-screen bg-cus">
      <Navbar />
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <EventSidebar highlight="invites" />
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-lg font-semibold mb-3">Invites</div>
            {!items ? (
              <div className="text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-gray-500">No invites</div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(ev => (
                  <li key={ev.id} className="bg-white rounded-lg shadow">
                    <Link to={`/events/${ev.id}`}>
                      <div className="aspect-[3/1] bg-gray-200 rounded-t-lg overflow-hidden">
                        {ev.cover && <img src={`${API_BASE_URL}/uploads/${ev.cover}`} className="w-full h-full object-cover" />}
                      </div>
                      <div className="p-3">
                        <div className="font-semibold line-clamp-1">{ev.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{new Date(ev.startAt).toLocaleString()}</div>
                      </div>
                    </Link>
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
