import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, FilePlus2,Search,Calendar,Group } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { fetchGroupCategories, listMyGroupInvites } from '@/services/groupsService';

type GroupsSidebarProps = {
  /** highlight current item for styling */
  highlight?: 'discover' | 'my' | 'invites' | 'create' | null;
  /** optionally pass categories / invite count; if omitted, the component fetches them */
  cats?: any[];
  invCount?: number;
};

export default function GroupsSidebar({
  highlight = null,
  cats: catsProp,
  invCount: invProp,
}: GroupsSidebarProps) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  const [cats, setCats] = useState<any[]>(catsProp ?? []);
  const [invCount, setInvCount] = useState<number>(invProp ?? 0);

  // fetch categories if not provided
  useEffect(() => {
    if (catsProp) { setCats(catsProp); return; }
    if (!accessToken) return;
    fetchGroupCategories(headersRef.current).then(setCats).catch(() => {});
  }, [accessToken, catsProp]);

  // fetch invites count if not provided
  useEffect(() => {
    if (typeof invProp === 'number') { setInvCount(invProp); return; }
    if (!accessToken) return;
    listMyGroupInvites(headersRef.current)
      .then(arr => setInvCount(arr.length))
      .catch(() => {});
  }, [accessToken, invProp]);

  const active = (key: string) => (highlight === key ? 'bg-gray-50' : '');

  return (
    <div className="md:sticky md:top-20 bg-white rounded-lg shadow p-3 space-y-2">
      <div className="text-sm font-semibold text-gray-700 mb-1">Groups</div>

      <Link to="/groups" className={`flex items-center px-3 py-2 rounded hover:bg-gray-100 ${active('create')}`}>
        <Search className="h-4 w-4 mr-2" /> Discover
      </Link>
      <Link to="/groups?my=1" className={`flex items-center px-3 py-2 rounded hover:bg-gray-100 ${active('create')}`}>
        <Group className="h-4 w-4 mr-2" /> Your Groups
      </Link>

      <Link to="/groups/invites" className={`flex items-center justify-between px-3 py-2 rounded hover:bg-gray-100 ${active('invites')}`}>
        <span className="flex items-center"><Inbox className="h-4 w-4 mr-2" /> Invites</span>
        {invCount > 0 && (
          <span className="text-xs bg-[#1877F2] text-white rounded-full px-2 py-0.5">{invCount}</span>
        )}
      </Link>

      <Link to="/groups/create" className={`flex items-center px-3 py-2 rounded hover:bg-gray-100 ${active('create')}`}>
        <FilePlus2 className="h-4 w-4 mr-2" /> Create Group
      </Link>

      <div className="h-px bg-gray-200 my-2" />
      <div className="text-xs text-gray-500 uppercase tracking-wide px-1 mb-1">Categories</div>
      <div className="max-h-64 overflow-auto pr-1 space-y-1">
        <Link to="/groups" className="block w-full text-left px-3 py-1.5 rounded hover:bg-gray-100">All</Link>
        {cats.map((c) => (
          <Link
            key={c.category_id}
            to={`/groups?categoryId=${c.category_id}`}
            className="block w-full text-left px-3 py-1.5 rounded hover:bg-gray-100"
          >
            {c.category_name}
          </Link>
        ))}
      </div>
    </div>
  );
}
