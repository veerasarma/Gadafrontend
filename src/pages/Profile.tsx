// src/pages/Profile.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { PostItem } from '@/components/post/PostItem';
import { decodeId } from '@/lib/idCipher';
import { stripUploads } from '@/lib/url';
import { Camera } from 'lucide-react';
import {
  fetchProfileSummary,
  fetchProfilePosts,
  fetchProfileFriends
} from '@/services/profileService';
import { Button } from '@/components/ui/button';
import { Loader2,MessageCircle } from 'lucide-react';
import EditProfileModal from "@/components/profile/EditProfileModal";
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload"; // ✅ reuse your existing uploader
import ConversationsFlyout from "@/components/messenger/ConversationsFlyout";
import { useChatDock } from "@/contexts/ChatDockContext";



const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

// Types (unchanged)
type Summary = {
  user: { id: number|string; username: string; fullName: string; avatar?: string|null; cover?: string|null; bio?: string };
  counts: { friends: number; posts: number; photos: number };
  previews: { friends: Array<{id:number; username:string; fullName:string; avatar?:string|null}>, photos: string[] };
  relationship: 'me'|'friends'|'requested'|'none';
};

type Post = {
  id: string;
  author: { id: string; username: string; fullName?: string; profileImage?: string|null };
  content: string;
  createdAt: string;
  privacy: string;
  shares: number;
  images: string[];
  videos: string[];
};

export default function Profile() {
  const { id: encoded } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, accessToken, updateProfile } = useAuth(); // ✅ bring updateProfile like in header
  const headers = useAuthHeader(accessToken);
  const [editOpen, setEditOpen] = useState(false);

  const { openChatWith } = useChatDock();

  // NEW: image edit modals
  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [isCoverImageModalOpen, setIsCoverImageModalOpen] = useState(false);

  // Resolve numeric id from url param (supports encoded ids)
  const userId = useMemo(() => {
    if (!encoded) return null;
    try { return Number(decodeId(encoded)); } catch { return Number(encoded); }
  }, [encoded]);

  // Tabs: posts | friends | photos
  const [tab, setTab] = useState<'posts'|'friends'|'photos'>('posts');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [sumLoading, setSumLoading] = useState(true);
  const [sumError, setSumError] = useState<string | null>(null);

  // Posts state
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [postCursor, setPostCursor] = useState<string | null>(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsDone, setPostsDone] = useState(false);

  // Friends state
  const [friends, setFriends] = useState<Array<{id:number; username:string; fullName:string; avatar?:string|null}>>([]);
  const [friendsCursor, setFriendsCursor] = useState<number | null>(null);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsDone, setFriendsDone] = useState(false);

  // ---- Stable headers ref (avoid re-fetch loops from object identity) ----
  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  // ---- Auth guard: redirect unauthenticated users to login (optional) ----
  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  // ------------------------- SUMMARY (guarded) -------------------------
  const summaryInitRef = useRef<{userId: number|null; done: boolean}>({ userId: null, done: false });

  useEffect(() => {
    if (!userId) return;
    if (!accessToken) return;

    // reset guard if viewing a different profile
    if (summaryInitRef.current.userId !== userId) {
      summaryInitRef.current = { userId, done: false };
    }
    if (summaryInitRef.current.done) return;
    summaryInitRef.current.done = true;

    setSumLoading(true);
    setSumError(null);

    let cancelled = false;
    fetchProfileSummary(userId, headersRef.current)
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((e) => { if (!cancelled) setSumError(e?.message || 'Failed to load'); })
      .finally(() => { if (!cancelled) setSumLoading(false); });

    return () => { cancelled = true; };
  }, [userId, accessToken]);

  // -------------------------- POSTS (guarded) --------------------------
  const postsLoadingRef = useRef(false);
  const postsInitKeyRef = useRef<string>('');

  const loadMorePosts = async (reset = false) => {
    if (!userId || !accessToken) return;
    if (postsLoadingRef.current) return;
    if (!reset && postsDone) return;

    postsLoadingRef.current = true;
    setPostsLoading(true);
    try {
      const { items = [], nextCursor } = await fetchProfilePosts(
        userId,
        { cursor: reset ? null : postCursor, limit: 10 },
        headersRef.current
      );

      setPosts(prev => reset ? items : [...(prev || []), ...items]);
      setPostCursor(nextCursor ?? null);
      if (!nextCursor || items.length === 0) setPostsDone(true);
    } catch (e) {
      console.error('[profile posts]', e);
    } finally {
      postsLoadingRef.current = false;
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    if (tab !== 'posts') return;
    if (!accessToken) return;

    const key = `posts|${userId}`;
    if (postsInitKeyRef.current === key) return; // already initialized for this user
    postsInitKeyRef.current = key;

    setPosts(null);
    setPostCursor(null);
    setPostsDone(false);
    Promise.resolve().then(() => loadMorePosts(true));
  }, [userId, tab, accessToken]);

  // ------------------------- FRIENDS (guarded) -------------------------
  const friendsLoadingRef = useRef(false);
  const friendsInitKeyRef = useRef<string>('');

  const loadMoreFriends = async (reset = false) => {
    if (!userId || !accessToken) return;
    if (friendsLoadingRef.current) return;
    if (!reset && friendsDone) return;

    friendsLoadingRef.current = true;
    setFriendsLoading(true);
    try {
      const { items = [], nextCursor } = await fetchProfileFriends(
        userId,
        { cursor: reset ? undefined : friendsCursor ?? undefined, limit: 24 },
        headersRef.current
      );
      setFriends(prev => reset ? items : [...prev, ...items]);
      setFriendsCursor(nextCursor ?? null);
      if (!nextCursor || items.length === 0) setFriendsDone(true);
    } catch (e) {
      console.error('[profile friends]', e);
    } finally {
      friendsLoadingRef.current = false;
      setFriendsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    if (tab !== 'friends') return;
    if (!accessToken) return;

    const key = `friends|${userId}`;
    if (friendsInitKeyRef.current === key) return; // already initialized
    friendsInitKeyRef.current = key;

    setFriends([]);
    setFriendsCursor(null);
    setFriendsDone(false);
    Promise.resolve().then(() => loadMoreFriends(true));
  }, [userId, tab, accessToken]);

  // --------------------------- LOADING STATES --------------------------
  if (authLoading || sumLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
        </div>
      </div>
    );
  }

  if (sumError || !summary) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 text-center text-red-600">
          {sumError || 'Profile not found'}
        </div>
      </div>
    );
  }

  const fullName = summary.user.fullName || summary.user.username;
  const avatarUrl = summary.user.avatar ? (API_BASE_URL + '/uploads/' + stripUploads(summary.user.avatar)) : '';
  const coverUrl = summary.user.cover ? (API_BASE_URL + '/uploads/' + stripUploads(summary.user.cover)) : '';

  // --- NEW: handlers to persist & reflect changes immediately ---
  const isMe = summary.relationship === 'me';

  const handleProfileImageSave = (imageUrl: string) => {
    // update global auth profile (same pattern as header) and local summary
    updateProfile?.({ profileImage: imageUrl });
    setSummary(s => s ? ({ ...s, user: { ...s.user, avatar: imageUrl } }) : s);
    setIsProfileImageModalOpen(false);
  };

  const handleCoverImageSave = (imageUrl: string) => {
    updateProfile?.({ coverImage: imageUrl });
    setSummary(s => s ? ({ ...s, user: { ...s.user, cover: imageUrl } }) : s);
    setIsCoverImageModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Cover + avatar */}
      <div className="bg-white shadow">
        <div className="relative max-w-5xl mx-auto">
          <div className="h-56 sm:h-64 w-full bg-gray-200 overflow-hidden rounded-b-lg relative">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-300" />
            )}

            {/* ✅ edit cover (only me) */}
            {isMe && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={() => setIsCoverImageModalOpen(true)}
                aria-label="Change cover photo"
              >
                <Camera className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="px-4 sm:px-6">
            <div className="flex items-end gap-4 -mt-10 sm:-mt-12">
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-white overflow-hidden bg-gray-200">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
                    {fullName?.[0] ?? 'U'}
                  </div>
                )}

                {/* ✅ edit avatar (only me) */}
                {isMe && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-1 right-1 bg-white/85 hover:bg-white h-8 w-8 rounded-full shadow"
                    onClick={() => setIsProfileImageModalOpen(true)}
                    aria-label="Change profile picture"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="pb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{fullName}</h1>
                <div className="text-gray-600 text-sm">
                  {summary.counts.friends} friends · {summary.counts.posts} posts
                </div>
              </div>
            </div>

            {/* action row */}
            <div className="flex justify-end gap-2 pb-4">
              {summary.relationship !== 'me' && (
                <>
                  <Button
      variant="secondary"
      onClick={() =>
        openChatWith(
          Number(summary.user.id),
          {
            id: Number(summary.user.id),
            username: summary.user.username,
            fullName: summary.user.fullName,
            avatar: summary.user.avatar || null,
          }
        )
      }
      aria-label={`Message ${summary.user.fullName || summary.user.username}`}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Message
    </Button>
                  <Button className="bg-[#1877F2] hover:bg-[#166FE5]">
                    {summary.relationship === 'friends'
                      ? 'Friends'
                      : summary.relationship === 'requested'
                      ? 'Requested'
                      : 'Add Friend'}
                  </Button>
                </>
              )}
              {isMe && (
                <Button variant="outline" onClick={() => setEditOpen(true)}>Edit Profile</Button>
              )}
              <EditProfileModal open={editOpen} onOpenChange={setEditOpen} onSaved={() => window.location.reload()} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex gap-6">
              <TabButton active={tab==='posts'} onClick={() => setTab('posts')}>Posts</TabButton>
              <TabButton active={tab==='friends'} onClick={() => setTab('friends')}>Friends</TabButton>
              <TabButton active={tab==='photos'} onClick={() => setTab('photos')}>Photos</TabButton>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* About card */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">About</h2>
          {summary.user.bio ? (
            <p className="text-gray-700">{summary.user.bio}</p>
          ) : (
            <p className="text-gray-500 italic">No bio yet</p>
          )}
        </div>

        {/* Posts Tab */}
        {tab === 'posts' && (
          <div className="space-y-4">
            {posts === null && postsLoading && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Loading…
              </div>
            )}
            {Array.isArray(posts) && posts.length > 0 && (
              <>
                {posts.map((p) => (
                  <PostItem key={p.id} post={p as any} />
                ))}

                {!postsDone && (
                  <div className="flex justify-center">
                    <Button onClick={() => loadMorePosts(false)} disabled={postsLoading}>
                      {postsLoading ? 'Loading…' : 'Load more'}
                    </Button>
                  </div>
                )}
              </>
            )}
            {posts !== null && posts.length === 0 && postsDone && !postsLoading && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No posts yet
              </div>
            )}
          </div>
        )}

        {/* Friends Tab */}
        {tab === 'friends' && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {friends.map(f => (
                <div key={f.id} className="flex flex-col items-center">
                  <div className="h-20 w-20 rounded-md overflow-hidden bg-gray-200">
                    {f.avatar ? (
                      <img src={API_BASE_URL+'/uploads/'+stripUploads(f.avatar)} alt={f.fullName} className="w-full h-full object-cover"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg text-gray-500">
                        {f.fullName?.[0] ?? 'U'}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm font-medium text-center leading-tight">
                    {f.fullName}
                  </div>
                </div>
              ))}
            </div>
            {!friendsDone && (
              <div className="flex justify-center mt-4">
                <Button onClick={() => loadMoreFriends(false)} disabled={friendsLoading}>
                  {friendsLoading ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
            {friends.length === 0 && friendsDone && (
              <div className="text-center text-gray-500 py-6">No friends to show</div>
            )}
          </div>
        )}

        {/* Photos Tab */}
        {tab === 'photos' && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {summary.previews.photos.map((src, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded">
                  <img src={API_BASE_URL + '/uploads/' + stripUploads(src)} className="w-full h-full object-cover" />
                </div>
              ))}
              {summary.previews.photos.length === 0 && (
                <div className="text-gray-500 text-center py-6 col-span-full">No photos yet</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ Uploader modals (reusing your existing component) */}
      <ProfileImageUpload
        isOpen={isProfileImageModalOpen}
        onClose={() => setIsProfileImageModalOpen(false)}
        onSave={handleProfileImageSave}
        title="Change Profile Picture"
        type="profile"
        description="Upload a new profile picture or enter an image URL"
      />
      <ProfileImageUpload
        isOpen={isCoverImageModalOpen}
        onClose={() => setIsCoverImageModalOpen(false)}
        onSave={handleCoverImageSave}
        title="Change Cover Photo"
        type="cover"
        description="Upload a new cover photo or enter an image URL"
      />
    </div>
  );
}

function TabButton({ active, onClick, children }:{
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-1 border-b-2 -mb-px text-sm sm:text-base ${
        active ? 'border-[#1877F2] text-[#1877F2] font-medium' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}
