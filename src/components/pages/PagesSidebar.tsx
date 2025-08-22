import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, FilePlus2,Search,Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { fetchCategories, listMyInvites } from '@/services/pagesService';

type PagesSidebarProps = {
  /** optional: pass your own categories; otherwise the component will fetch them */
  cats?: any[];
  /** optional: pass your own invite count; otherwise the component will fetch it */
  invCount?: number;
  /** optional: highlight current item */
  highlight?: 'discover' | 'my' | 'invites' | 'create' | null;
};

export default function PagesSidebar({
  cats: catsProp,
  invCount: invProp,
  highlight = null,
}: PagesSidebarProps) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  const [cats, setCats] = useState<any[]>(catsProp ?? []);
  const [invCount, setInvCount] = useState<number>(invProp ?? 0);

  // Fetch categories if not provided
  useEffect(() => {
    if (catsProp) { setCats(catsProp); return; }
    if (!accessToken) return;
    fetchCategories(headersRef.current).then(setCats).catch(() => {});
  }, [accessToken, catsProp]);

  // Fetch invites count if not provided
  useEffect(() => {
    if (typeof invProp === 'number') { setInvCount(invProp); return; }
    if (!accessToken) return;
    listMyInvites(headersRef.current)
      .then(arr => setInvCount(arr.length))
      .catch(() => {});
  }, [accessToken, invProp]);

  const active = (key: string) => (highlight === key ? 'bg-gray-50' : '');

  return (
    <div className="md:sticky md:top-20 bg-white rounded-lg shadow p-3 space-y-2">
      <div className="text-sm font-semibold text-gray-700 mb-1">Pages</div>

      <Link to="/pages" className={`flex items-center px-3 py-2 rounded hover:bg-gray-100 ${active('create')}`}>
        <Search className="h-4 w-4 mr-2" /> Discover
      </Link>
      <Link to="/pages?my=1" className={`flex items-center px-3 py-2 rounded hover:bg-gray-100 ${active('create')}`}>
        <Flag className="h-4 w-4 mr-2" /> Your Pages
      </Link>

      <Link to="/pages/invites" className={`flex items-center justify-between px-3 py-2 rounded hover:bg-gray-100 ${active('invites')}`}>
        <span className="flex items-center">
          <Inbox className="h-4 w-4 mr-2" /> Invites
        </span>
        {invCount > 0 && (
          <span className="text-xs bg-[#1877F2] text-white rounded-full px-2 py-0.5">
            {invCount}
          </span>
        )}
      </Link>

      <Link to="/pages/create" className={`flex items-center px-3 py-2 rounded hover:bg-gray-100 ${active('create')}`}>
        <FilePlus2 className="h-4 w-4 mr-2" /> Create Page
      </Link>

      <div className="h-px bg-gray-200 my-2" />

      <div className="text-xs text-gray-500 uppercase tracking-wide px-1 mb-1">
        Categories
      </div>
      <div className="max-h-64 overflow-auto pr-1 space-y-1">
        <Link to="/pages" className="block w-full text-left px-3 py-1.5 rounded hover:bg-gray-100">
          All
        </Link>
        {cats.map((c) => (
          <Link
            key={c.category_id}
            to={`/pages?categoryId=${c.category_id}`}
            className="block w-full text-left px-3 py-1.5 rounded hover:bg-gray-100"
          >
            {c.category_name}
          </Link>
        ))}
      </div>
    </div>
  );
}
