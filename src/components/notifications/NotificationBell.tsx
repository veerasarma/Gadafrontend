// src/components/notifications/NotificationBell.tsx
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { PostDetailModal } from '@/components/post/PostDetailModal';
import { stripUploads } from '@/lib/url';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';


export default function NotificationBell() {
  const { items, unreadCount, markAll, markSeenNow } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const state = location.state as any;

  const isModal = state?.modal === true;


  useEffect(() => {
    if (!open) return;
    markSeenNow().catch(console.error);
  }, [open]);

  // close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="font-semibold">Notifications</div>
            <button onClick={() => markAll().catch(console.error)} className="text-sm text-blue-600 hover:underline">
              Mark all as read
            </button>
          </div>
          <ul className="max-h-96 overflow-y-auto divide-y">
            {items.slice(0, 20).map(n => (
              <li key={n.id} className={`p-3 ${!n.readAt ? 'bg-blue-50' : ''}`}>
                <NotifRow n={n} />
              </li>
            ))}
            {items.length === 0 && (
              <li className="p-6 text-center text-gray-500">No notifications</li>
            )}
          </ul>
          <div className="p-2 text-center">
            <Link to="/notifications" className="text-sm text-blue-600 hover:underline">See all</Link>
          </div>
        </div>
      )}
       {isModal && state?.postId && (
        <PostDetailModal
          postId={String(state.postId)}
          open={true}
          onOpenChange={() => window.history.back()}
        />
      )}
    </div>
  );
}

function NotifRow({ n }: { n: any }) {
  const text = renderText(n);
  const href = renderLink(n);
  const loc = useLocation(); // React Router location (plain)
const returnTo = `${loc.pathname}${loc.search}${loc.hash}`;
  return (
    <Link
    to={href}
    state={{ isModal: true, returnTo }}   // ✅ ONLY plain JSON
  >
       {/* <Link to={href} className="flex items-start gap-3">  */}
      <img src={(n.actorAvatar)?API_BASE_URL+'/uploads/'+stripUploads(n.actorAvatar): API_BASE_URL+'/uploads//profile/defaultavatar.png'} alt="" className="h-9 w-9 rounded-full object-cover" />
      <div className="flex-1">
        <div className="text-sm">
          <span className="font-semibold">{n.actorName}</span> {text}
        </div>
        <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
      </div>
      {!n.readAt && <span className="mt-2 h-2 w-2 bg-blue-600 rounded-full" />}
    </Link>
  );
}

function renderText(n: any) {
  switch (n.type) {
    case 'post_like': return 'liked your post.';
    case 'post_comment': return 'commented on your post.';
    case 'post_share': return 'shared your post.';
    case 'friend_request': return 'sent you a friend request.';
    case 'friend_accept': return 'accepted your friend request.';
    case 'reel_like': return 'liked your reel.';
    case 'reel_comment': return 'commented on your reel.';
    case 'group_post': return 'posted in your group.';
    default: return 'sent you a notification.';
  }
}

function renderLink(n: any) {
  const m = n.meta || {};
  switch (n.entityType) {
    case 'post':       return `/posts/${m.postId || n.entityId}`;
    case 'reel':       return `/reels`;
    case 'group':      return `/groups/${m.groupId || n.entityId}`;
    case 'group_post': return `/groups/${m.groupId}/posts/${n.entityId}`;
    case 'user':       return `/profile/${n.actorId}`;
    default:           return '#';
  }
}
