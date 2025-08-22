import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, Inbox, FilePlus2,Search,Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { listEventCategories, listMyEventInvites } from '@/services/eventsService';

type Props = {
  highlight?: 'discover' | 'my' | 'invites' | 'create' | null;
  cats?: any[];
  invCount?: number;
};

export default function EventSidebar({ highlight = null, cats: catsProp, invCount: invProp }: Props) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  const [cats, setCats] = useState<any[]>(catsProp ?? []);
  const [invCount, setInvCount] = useState<number>(invProp ?? 0);
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (catsProp) { setCats(catsProp); return; }
    if (!accessToken) return;
    listEventCategories(headersRef.current).then(setCats).catch(()=>{});
  }, [accessToken, catsProp]);

  useEffect(() => {
    if (typeof invProp === 'number') { setInvCount(invProp); return; }
    if (!accessToken) return;
    listMyEventInvites(headersRef.current).then(arr => setInvCount(arr.length)).catch(()=>{});
  }, [accessToken, invProp]);

  const active = (k: string) => (highlight === k ? 'bg-gray-50' : '');

  return (
    <div className="md:sticky md:top-20 bg-white rounded-lg shadow p-3 space-y-2">
      <div className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
        <CalendarDays className="h-4 w-4 mr-2" /> Events
      </div>

   
      <Link to="/events" className={`flex items-center px-3 py-2 rounded hover:bg-gray-100 ${active('create')}`}>
        <Search className="h-4 w-4 mr-2" /> Discover
      </Link>
      <Link to="/events?my=going" className={`flex items-center px-3 py-2 rounded hover:bg-gray-100 ${active('create')}`}>
        <Calendar className="h-4 w-4 mr-2" /> Your Events
      </Link>
     
      <Link to="/events/invites" className={`flex items-center justify-between px-3 py-2 rounded hover:bg-gray-100 ${active('invites')}`}>
        <span className="flex items-center"><Inbox className="h-4 w-4 mr-2" /> Invites</span>
        {invCount > 0 && (
          <span className="text-xs bg-[#1877F2] text-white rounded-full px-2 py-0.5">{invCount}</span>
        )}
      </Link>
      <Link to="/events/create" className={`flex items-center px-3 py-2 rounded hover:bg-gray-100 ${active('create')}`}>
        <FilePlus2 className="h-4 w-4 mr-2" /> Create Event
      </Link>

      <div className="h-px bg-gray-200 my-2" />
      <div className="text-xs text-gray-500 uppercase tracking-wide px-1 mb-1">Categories</div>
      <div className="max-h-64 overflow-auto pr-1 space-y-1">
        <Link to="/events" className="block w-full text-left px-3 py-1.5 rounded hover:bg-gray-100">All</Link>
        {cats.map((c:any) => (
          <Link
            key={c.category_id}
            to={`/events?categoryId=${c.category_id}`}
            className="block w-full text-left px-3 py-1.5 rounded hover:bg-gray-100"
          >
            {c.category_name}
          </Link>
        ))}
      </div>
    </div>
  );
}
