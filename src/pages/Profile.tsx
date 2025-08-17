import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePost } from '@/contexts/PostContext';
import { Navbar } from '@/components/layout/Navbar';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostItem } from '@/components/post/PostItem';
import { Loader2 } from 'lucide-react';
import { fetchUserProfile, UserProfile } from '@/services/userServices';
import { decodeId } from '@/lib/idCipher';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { posts } = usePost();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  // redirect if not signed in
  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  // fetch profile from API
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchUserProfile(id)
      .then(setProfile)
      .catch(err => {
        console.error(err);
        setError(err.message.includes('not found') ? 'not-found' : 'Unable to load profile');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // filter this user’s posts
  const userPosts = id ? posts.filter(p => p.author.id === id) : [];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
      </div>
    );
  }

  if (error === 'not-found') {
    return navigate('/not-found');
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 bg-cus">
        {profile && <ProfileHeader profile={profile} />}

        {/* About section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">About</h2>
          {profile?.bio ? (
            <p className="text-gray-600">{profile.bio}</p>
          ) : (
            <p className="text-gray-500 italic">No bio yet</p>
          )}
        </div>

        {/* Posts */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Posts</h2>
          {userPosts.length > 0 ? (
            userPosts.map(p => <PostItem key={p.id} post={p} />)
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-700">No posts yet</h3>
              <p className="text-gray-500 mt-1">
                This user hasn&apos;t posted anything yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
