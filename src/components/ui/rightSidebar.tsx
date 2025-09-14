// src/components/ui/rightSidebar.tsx
import * as React from 'react';
import { Crown, TrendingUp, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { fetchProUsers, type ProUser, fetchTrendingTags,fetchUserpackage,fetchProPages, type TrendingTagRow } from '@/services/proService';
import { fetchFriendSuggestions, type User as FriendUser,sendFriendRequest } from '@/services/friendService';
import { stripUploads } from '@/lib/url';
import { useNavigate,Link } from "react-router-dom";
import { toast } from 'sonner';
import { encodeId } from "@/lib/idCipher";
import SponsoredAdCard from "@/components/ads/SponsoredAdCard";   //


type ProItem = { id: string | number; name: string; avatar: string };
type Tag = { tag: string; count: number };

export type RightSidebarProps = {
  onAddFriend?: (id: string | number) => void;
  onUpgradeClick?: () => void;
  onSeeAllSuggestions?: () => void;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

// ----- sample fallbacks (used while loading / failures) -----
const sampleUsers: ProItem[] = [
  { id: 1, name: 'Chibuzor Okafor', avatar: `${API_BASE_URL}/uploads/profile/defaultavatar.png` },
  { id: 2, name: 'Ajibo Chima',     avatar: `${API_BASE_URL}/uploads/profile/defaultavatar.png` },
  { id: 3, name: 'Anthonia Adoyi',  avatar: `${API_BASE_URL}/uploads/profile/defaultavatar.png` },
];

const samplePages: ProItem[] = [
  { id: 'p1', name: 'STAGES',      avatar: `${API_BASE_URL}/uploads//profile/defaultavatar.png` },
  { id: 'p2', name: 'Movie World', avatar: `${API_BASE_URL}/uploads//profile/defaultavatar.png` },
  { id: 'p3', name: 'EBUKABEST',   avatar: `${API_BASE_URL}/uploads//profile/defaultavatar.png` },
];

const sampleTags: Tag[] = [
  { tag: '#movieworld', count: 15 }, { tag: '#space', count: 5 }, { tag: '#gada', count: 4 },
  { tag: '#science', count: 6 },     { tag: '#Fact',  count: 4 }, { tag: '#sports', count: 3 },
];

// ----- shells -----
function SectionShell({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <section className={cn('bg-white rounded-2xl shadow-sm border p-4', className)}>{children}</section>;
}

function HorizontalChips({
  items, title, cta, onCta, onItemClick,
}: {
  items: ProItem[];
  title: string;
  cta?: string;
  onCta?: () => void;
  onItemClick?: (item: ProItem) => void;   // ⬅️ NEW
}) {
  return (
    <SectionShell className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        {cta && (
          <button type="button" onClick={onCta} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            {cta}
          </button>
        )}
      </div>

      <div className="flex gap-5 overflow-x-auto pb-1 hide-scrollbar">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick?.(item)}        // ⬅️ only clickable if handler provided
            className="min-w-[84px] flex flex-col items-center focus:outline-none"
            aria-label={`Open ${item.name}`}
          >
            <div className="h-20 w-20 rounded-full shadow ring-2 ring-white overflow-hidden">
              <img src={item.avatar} alt={item.name} className="h-full w-full object-cover" />
            </div>
            <div className="mt-2 text-center text-sm font-medium text-gray-900 line-clamp-1">{item.name}</div>
          </button>
        ))}
      </div>
    </SectionShell>
  );
}

function TrendingCard({ tags }: { tags: Tag[] }) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return (
      <div className="rounded-2xl p-5 bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5" />
          <h3 className="text-base font-semibold">Trending</h3>
        </div>
        <div className="text-white/90 text-sm">No trends right now</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5" />
        <h3 className="text-base font-semibold">Trending</h3>
      </div>

      <ul className="space-y-2">
        {tags.map((t) => {
          const name = (t.tag || '').replace(/^#/, '');           // display/input safety
          const to = `/hashtag/${encodeURIComponent(name)}`;       // e.g. /hashtag/Gada
          return (
            <li key={t.tag}>
              <Link
                to={to}
                title={`Open #${name}`}
                className="flex items-center justify-between rounded-md px-2 py-2
                           hover:bg-white/10 focus:bg-white/10 focus:outline-none
                           transition-colors"
              >
                <div className="text-lg font-semibold">#{name}</div>
                <div className="text-sm/5 opacity-90">{t.count} Posts</div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


function SuggestionsCard({
  list, onAdd, onSeeAll,
}: {
  list: FriendUser[];
  onAdd?: (id: string | number) => void;
  onSeeAll?: () => void;
}) {
  return (
    <SectionShell className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Suggested Friends</h3>
        <button type="button" onClick={onSeeAll} className="text-sm font-medium text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
          See All <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <ul className="divide-y">
        {list.map((s) => {
          
          const id = (s as any).id ?? (s as any).user_id;
          const name = (s as any).user_name ?? (s as any).username ?? 'User';
          let avatar;
          if((s as any).profileImage)
          {
           
            let profile = (s as any).profileImage;
             avatar = API_BASE_URL+'/uploads/'+(profile);
          }
          else{
             avatar =`${API_BASE_URL}/uploads//profile/defaultavatar.png`;
          }
  

          return (
            <li key={id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover bg-gray-100" />
                <div className="min-w-0">
                   <Link to={`/profile/${encodeId(id)}`}>
                  <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
                  </Link>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => onAdd?.(id)}
                aria-label={`Add ${name}`}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
              
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}

// ---------- Container that loads Pro Users, Trending Hashtags & Suggestions ----------
export default function RightSidebar({
  onAddFriend, onUpgradeClick, onSeeAllSuggestions,
}: RightSidebarProps) {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const navigate = useNavigate();
  const headersRef = React.useRef(headers);
  React.useEffect(() => { headersRef.current = headers; }, [headers]);
  


  const [proUsers, setProUsers] = React.useState<ProItem[]>(sampleUsers);
  const [suggestions, setSuggestions] = React.useState<FriendUser[]>([]);
  const [tags, setTags] = React.useState<Tag[]>(sampleTags);
  const [userPackage, setUserPacakge] = React.useState<Boolean>(false);
  const ctaProps = userPackage ? {} : { cta: "Upgrade", onCta: () => navigate("/packages") };
  const [proPages, setProPages] = React.useState<ProItem[]>(samplePages);

  const handleAddFriend = async (id: string | number) => {
    const idStr = String(id);
    try {
      // 1) call API
      await sendFriendRequest(id, headersRef.current);
  ``
      // 2) remove from UI list
      setSuggestions(prev =>
        prev.filter(u => String((u as any).id ?? (u as any).user_id) !== idStr)
      );
      toast.success('Your request has been sent successfully.');
    } catch (e) {
      console.error('Failed to send friend request', e);
      toast.error('Failed to send friend request', e);
      // optionally show a toast
    }
  };


  // guard to avoid multiple calls on re-renders
  const loadedRef = React.useRef(false);

  React.useEffect(() => {
    if (!accessToken) return;
    if (loadedRef.current) return;
    loadedRef.current = true;

    let alive = true;

    // Load Pro Users
    (async () => {
      try {
        const list = await fetchProUsers(headers, 12);
        if (!alive) return;
        setProUsers(
          list.map((u: ProUser) => {
            const base = `${API_BASE_URL}`.replace(/\/+$/, '');
            let avatar = u.avatar || '/uploads//profile/defaultavatar.png';
            if (!avatar.startsWith('/uploads')) {
              avatar = `/uploads/${avatar}`.replace('//uploads', '/uploads');
            }
            return { id: u.id, name: u.name, avatar: `${base}${avatar}` };
          })
        );
      } catch (e) {
        console.error('[RightSidebar] failed to load pro users', e);
      }
    })();

    (async () => {
      try {
        const list = await fetchUserpackage(headers);
        console.log(list,'listlist')
        if (!alive) return;
        setUserPacakge(list?.data?.active)
      } catch (e) {
        console.error('[RightSidebar] failed to load pro users', e);
      }
    })();

    (async () => {
      try {
        const list = await fetchProPages(headers, 12);
        if (!alive) return;
        const base = `${API_BASE_URL}`.replace(/\/+$/, '');
        setProPages(
          list.map(p => ({
            id: p.id,
            name: p.name,
            avatar: `${base}${p.avatar}`, // p.avatar already has "/uploads/..."
          }))
        );
      } catch (e) {
        console.error('[RightSidebar] failed to load pro pages', e);
      }
    })();

    // Load Trending Hashtags
    (async () => {
      try {
        const rows: TrendingTagRow[] = await fetchTrendingTags(headers, 12, '24 HOUR');
        if (!alive) return;
        setTags(
          rows.data.map(r => ({
            tag: r.hashtag.startsWith('#') ? r.hashtag : `#${r.hashtag}`,
            count: Number(r.post_count) || 0,
          }))
        );
      } catch (e) {
        console.error('[RightSidebar] failed to load trending hashtags', e);
      }
    })();

    // Load Friend Suggestions
    (async () => {
      try {
        const rows = await fetchFriendSuggestions(headers);
        if (!alive) return;
        setSuggestions(rows || []);
      } catch (e) {
        console.error('[RightSidebar] failed to load friend suggestions', e);
        setSuggestions([]);
      }
    })();

    return () => { alive = false; };
  }, [accessToken]); // only once after token exists

  return (
    <div className="sticky top-20 space-y-6">
      <HorizontalChips items={proUsers}   title="Pro Users"  {...ctaProps} onItemClick={(item) => navigate(`/profile/${encodeId(item.id)}`)}/>
      <HorizontalChips items={proPages /* or samplePages if you haven't wired dynamic yet */} title="Pro Pages"
      {...ctaProps} onItemClick={(item) => navigate(`/pages/${item.id}`)}   // ⬅️ open view
      />

      <TrendingCard tags={tags} />
      <SponsoredAdCard placement="sidebar" />
      <SectionShell className="p-5">
        <h3 className="text-lg font-semibold">Gadashares</h3>
        <div className="mt-2 h-14 rounded-xl bg-gray-50" />
      </SectionShell>
      <SuggestionsCard list={suggestions} onAdd={handleAddFriend} onSeeAll={() => navigate("/friends")} />
    </div>
  );
}
