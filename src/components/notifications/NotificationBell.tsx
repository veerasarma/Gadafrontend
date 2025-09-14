// src/components/notifications/NotificationBell.tsx
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { PostDetailModal } from '@/components/post/PostDetailModal';
import { stripUploads } from '@/lib/url';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

export default function NotificationBell() {
  const { items, unreadCount, markAll, markSeenNow, soundEnabled, setSoundEnabled } = useNotifications();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [desktopPos, setDesktopPos] = useState<{top:number,left:number,width:number}|null>(null);

  const location = useLocation();
  const state = location.state as any;
  const isModal = state?.modal === true || state?.isModal === true;

  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches;

  // mark "seen" when opened
  useEffect(() => {
    if (open) markSeenNow().catch(() => {});
  }, [open]); // eslint-disable-line

  // position the desktop popover via portal so it never gets clipped
  useEffect(() => {
    if (!open || !isDesktop || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    // align right edge with bell, 8px down (mt-2)
    setDesktopPos({
      top: rect.bottom + 8 + window.scrollY,
      left: rect.right - 384 + window.scrollX, // 384px = w-96
      width: 384,
    });
  }, [open, isDesktop]);

  // outside click (desktop only; mobile uses backdrop)
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open || !isDesktop) return;
      const panel = document.getElementById('notif-popover');
      if (panel && (panel === e.target || panel.contains(e.target as Node))) return;
      if (anchorRef.current && anchorRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, isDesktop]);

  return (
    <div className="relative">
      <button
        ref={anchorRef}
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
        <>
          {/* Mobile sheet */}
          <button
            className="fixed inset-0 z-[95] sm:hidden bg-black/10"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          />
          <div className="sm:hidden fixed inset-x-2 top-[64px] z-[100] bg-white shadow-xl rounded-lg overflow-hidden">
            <Header
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              onMarkAll={() => markAll().catch(() => {})}
            />
            <List items={items} onNavigate={() => setOpen(false)} />
            <Footer onNavigate={() => setOpen(false)} />
          </div>

          {/* Desktop popover via portal — anchored to bell, right-aligned */}
          {isDesktop && desktopPos &&
            createPortal(
              <div
                id="notif-popover"
                className="z-[110] bg-white shadow-xl rounded-lg overflow-hidden border"
                style={{
                  position: 'absolute',
                  top: desktopPos.top,
                  left: desktopPos.left,
                  width: desktopPos.width,
                }}
              >
                <Header
                  soundEnabled={soundEnabled}
                  setSoundEnabled={setSoundEnabled}
                  onMarkAll={() => markAll().catch(() => {})}
                />
                <List items={items} onNavigate={() => setOpen(false)} />
                <Footer onNavigate={() => setOpen(false)} />
              </div>,
              document.body
            )
          }
        </>
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

function Header({
  soundEnabled,
  setSoundEnabled,
  onMarkAll,
}: {
  soundEnabled: boolean;
  setSoundEnabled: (updater: (v: boolean) => boolean) => void;
  onMarkAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <div className="font-semibold">Notifications</div>
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => setSoundEnabled(v => !v)}
          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
          title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
        >
          {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          <span className="hidden sm:inline">{soundEnabled ? 'Sound on' : 'Muted'}</span>
        </button>
        <span className="hidden sm:inline text-gray-300">•</span>
        <button onClick={onMarkAll} className="text-blue-600 hover:underline">
          Mark all as read
        </button>
      </div>
    </div>
  );
}

function List({ items, onNavigate }: { items: any[]; onNavigate: () => void }) {
  return (
    <ul className="max-h-[70vh] overflow-y-auto overscroll-contain divide-y">
      {items.slice(0, 20).map(n => (
        <li key={n.id} className={`p-3 ${!n.readAt ? 'bg-blue-50' : ''}`}>
          <NotifRow n={n} onNavigate={onNavigate} />
        </li>
      ))}
      {items.length === 0 && (
        <li className="p-6 text-center text-gray-500">No notifications</li>
      )}
    </ul>
  );
}

function Footer({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="p-2 text-center border-t">
      <Link
        to="/notifications"
        onClick={onNavigate}
        className="inline-block text-sm text-blue-600 hover:underline"
      >
        See all
      </Link>
    </div>
  );
}

function NotifRow({ n, onNavigate }: { n: any; onNavigate: () => void }) {
  const text = renderText(n);
  const href = renderLink(n);
  const loc = useLocation();
  const returnTo = `${loc.pathname}${loc.search}${loc.hash}`;

  return (
    <Link
      to={href}
      state={{ isModal: true, returnTo, postId: (n.meta?.postId || n.entityId) ?? undefined }}
      onClick={onNavigate}
      className="flex items-start gap-3"
    >
      <img
        src={
          n.actorAvatar
            ? API_BASE_URL + '/uploads/' + stripUploads(n.actorAvatar)
            : API_BASE_URL + '/uploads//profile/defaultavatar.png'
        }
        alt=""
        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-semibold truncate">{n.actorName}</span> {text}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(n.createdAt).toLocaleString()}
        </div>
      </div>
      {!n.readAt && <span className="mt-2 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0" />}
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
    case 'new_message': return 'sent new message.';
    case 'live_start': return 'Started live.';
    default: return 'sent you a notification.';
  }
}

function renderLink(n: any) {
  const m = n.meta || {};
  switch (n.entityType) {
    case 'live':       return `/posts/${m.postId || n.entityId}`;
    case 'post':       return `/posts/${m.postId || n.entityId}`;
    case 'reel':       return `/reels`;
    case 'group':      return `/groups/${m.groupId || n.entityId}`;
    case 'group_post': return `/groups/${m.groupId}/posts/${n.entityId}`;
    case 'user':       return `/profile/${n.actorId}`;
    default:           return '#';
  }
}
