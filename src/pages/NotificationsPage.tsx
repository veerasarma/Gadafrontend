// src/pages/NotificationsPage.tsx
import { useNotifications } from '@/contexts/NotificationContext';
import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stripUploads } from '@/lib/url';
import { useAuth } from '@/contexts/AuthContext';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

export default function NotificationsPage() {
  const {accessToken} = useAuth();
  const { items, unreadCount, loadMore, refresh, markAll } = useNotifications();
  useEffect(() => { 
    if (!accessToken) return;
    refresh().catch(console.error); 
  }, [accessToken]);

  return (
    <div className="flex flex-col min-h-screen bg-cus">
      <Navbar />
      <div className="flex flex-1 overflow-hidden px-4 lg:px-8 py-6">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto gap-6">
          <aside className="hidden lg:block lg:w-1/5">
            <div className="sticky"><Sidebar /></div>
          </aside>
          <main className="flex-1 overflow-y-auto">
            <div className="bg-white rounded-lg shadow">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h1 className="text-xl font-semibold">Notifications</h1>
                {unreadCount > 0 && (
                  <button onClick={() => markAll().catch(console.error)} className="text-sm text-blue-600 hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>
              <ul className="divide-y">
                {items.map(n => (
                  <li key={n.id} className={`p-4 ${!n.readAt ? 'bg-blue-50' : ''}`}>
                    <Row n={n} />
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="p-10 text-center text-gray-500">You have no notifications.</li>
                )}
              </ul>
              <div className="p-4 text-center">
                <button onClick={() => loadMore().catch(console.error)} className="text-blue-600 hover:underline">
                  Load more
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Row({ n }: { n: any }) {
  const text = n.message || `${n.actorName} ${simpleText(n.type)}`;
  const href = (n.meta && n.meta.postId) ? `/posts/${n.meta.postId}` : '#';
  return (
    <Link to={href} className="flex items-start gap-3">
      <img src={(n.actorAvatar)?API_BASE_URL+'/uploads/'+stripUploads(n.actorAvatar): API_BASE_URL+'/uploads//profile/defaultavatar.png'} alt="" className="h-10 w-10 rounded-full object-cover" />

      <div className="flex-1">
        <div className="text-sm"><span className="font-semibold">{n.actorName}</span> {simpleText(n.type)}</div>
        <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
      </div>
      {!n.readAt && <span className="mt-2 h-2 w-2 bg-blue-600 rounded-full" />}
    </Link>
  );
}
function simpleText(t: string) {
  switch (t) {
    case 'post_like': return 'liked your post';
    case 'post_comment': return 'commented on your post';
    case 'friend_request': return 'sent you a friend request';
    case 'friend_accept': return 'accepted your friend request';
    case 'reel_like': return 'liked your reel';
    case 'new_message': return 'sent new message.';
    default: return 'sent you a notification';
  }
}
