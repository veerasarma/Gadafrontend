
import { useEffect } from 'react';
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

export default function FriendsPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !accessToken) {
      navigate('/login');
    }
  }, [authLoading, accessToken, navigate]);

  if (authLoading) return null;

  return (
    <div className="flex flex-col h-screen bg-cus">
         <Navbar />
   
         {/* three-column layout */}
         <div className="flex flex-1 overflow-hidden px-4 lg:px-8">
           <div className="flex flex-1 max-w-[1600px] w-full mx-auto space-x-6">
   
             {/* LEFT SIDEBAR */}
             <aside className="hidden lg:block lg:w-1/5 min-h-0 overflow-y-auto py-6">
               <div className="sticky top-16">   {/* pins under 64px navbar */}
                 <Sidebar />
               </div>
             </aside>
   
             {/* CENTER FEED */}
             <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
               <div className="space-y-6 py-6">
          {/* Main content */}
          {/* <main className="flex-1 space-y-6"> */}
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
              <h2 className="text-xl font-semibold mb-4">Your Friends</h2>
             
                <FriendList />
            </section>

              </FriendProvider>
              </div>
          </main>
          
          {/* RIGHT WIDGETS */}
          <aside className="hidden xl:block xl:w-80 py-6">
           <RightSidebar/>
          </aside>

        </div>
      </div>
    </div>
    
  );
}

