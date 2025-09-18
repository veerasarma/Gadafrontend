import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FriendProvider } from '@/contexts/FriendContext';
import { Navbar } from '@/components/layout/Navbar';
import Sidebar from '@/components/ui/Sidebar1';
import { FriendList } from '@/components/friends/FriendList';
import { FriendRequests } from '@/components/friends/FriendRequests';
import { UserSearch } from '@/components/friends/UserSearch';
import { PeopleYouMayKnow } from '@/components/friends/PeopleYouMayKnow';
import RightSidebar from '@/components/ui/RightSidebar';
import { useAuthHeader } from '@/hooks/useAuthHeader';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085';

export default function FriendsPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const headers = useAuthHeader(accessToken);
  const navigate = useNavigate();
  const [friendCount, setFriendCount] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !accessToken) {
      navigate('/login');
    }
  }, [authLoading, accessToken, navigate]);

  // Fetch total friends count (robust with fallbacks)
  useEffect(() => {
    if (!accessToken) return;

    (async () => {
      try {
        // Try dedicated count endpoint first
        const r1 = await fetch(`${API_BASE}/api/friends/count`, {
          headers,
          credentials: 'include',
        });
        if (r1.ok) {
          const j = await r1.json().catch(() => ({}));
          if (typeof j?.count === 'number') {
            setFriendCount(j.count);
            return;
          }
        }

        // Fallback: try to get count via list metadata
        const r2 = await fetch(`${API_BASE}/api/friends?limit=1`, {
          headers,
          credentials: 'include',
        });
        if (r2.ok) {
          const totalFromHeader = Number(r2.headers.get('X-Total-Count') || NaN);
          if (!Number.isNaN(totalFromHeader)) {
            setFriendCount(totalFromHeader);
            return;
          }
          const j2 = await r2.json().catch(() => ({}));
          if (typeof j2?.total === 'number') {
            setFriendCount(j2.total);
            return;
          }
          // Last resort: fetch a page and count length (not perfect but non-breaking)
          const r3 = await fetch(`${API_BASE}/api/friends?limit=5000`, {
            headers,
            credentials: 'include',
          });
          if (r3.ok) {
            const j3 = await r3.json().catch(() => ({}));
            const items = Array.isArray(j3?.items) ? j3.items : (Array.isArray(j3) ? j3 : []);
            if (Array.isArray(items)) setFriendCount(items.length);
          }
        }
      } catch {
        // ignore; leave as null
      }
    })();
  }, [accessToken, headers]);

  if (authLoading) return null;

  return (
    <div className="flex flex-col h-screen bg-cus">
      <Navbar />

      {/* three-column layout */}
      <div className="flex flex-1 overflow-hidden px-4 lg:px-8">
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto space-x-6">

          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto py-6">
            <div className="sticky top-16">{/* pins under 64px navbar */}
              <Sidebar />
            </div>
          </aside>

          {/* CENTER FEED */}
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="space-y-6 py-6">
              <FriendProvider>
                {/* People You May Know */}
                <section className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">People You May Know</h2>
                  <PeopleYouMayKnow />
                </section>

                {/* Requests & Search in two columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Friend Requests</h2>
                    <FriendRequests />
                  </section>
                  <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Find Friends</h2>
                    <UserSearch />
                  </section>
                </div>

                {/* Your Friends */}
                <section className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      Your Friends
                      {friendCount !== null && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 align-middle">
                         ( {friendCount} )
                        </span>
                      )}
                    </h2>
                  </div>

                  <FriendList />
                </section>
              </FriendProvider>
            </div>
          </main>

          {/* RIGHT WIDGETS */}
          <aside className="hidden xl:block xl:w-80 py-6">
            <RightSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
