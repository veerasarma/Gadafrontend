import { useFriends } from '@/contexts/FriendContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export function FriendRequests() {
  const { user } = useAuth();
  const { requests, respondRequest } = useFriends();
  const incoming = requests.filter(r => r.toUserId === user!.id && r.status===0);

  if (incoming.length === 0) {
    return <p className="p-4 text-gray-500">No new friend requests.</p>;
  }

  return (
    <div className="p-4 space-y-4">
      {incoming.map(r => (
        <div key={r.id} className="flex items-center justify-between bg-white p-3 rounded shadow">
          <div className="flex items-center space-x-3">
            <img
              src={(r.fromProfileImage?API_BASE_URL+'/uploads/'+r.fromProfileImage:API_BASE_URL+'/uploads/profile/defaultavatar.png')}
              alt={r.fromUsername}
              className="h-10 w-10 rounded-full object-cover"
            />
            <span>{r.fromUsername}</span>
          </div>
          <div className="space-x-2">
            <Button size="sm" onClick={() => respondRequest(r.id, 'accepted')}>
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => respondRequest(r.id, 'declined')}>
              Decline
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
