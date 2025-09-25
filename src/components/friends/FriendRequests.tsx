import { useFriends } from '@/contexts/FriendContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export function FriendRequests() {
  const { user } = useAuth();
  const { requests, respondRequest } = useFriends();
  const incoming = requests.filter(
    (r) => r.toUserId === user!.id && r.status === 0
  );

  if (incoming.length === 0) {
    return <p className="p-4 text-gray-500">No new friend requests.</p>;
  }

  return (
    // Scroll area so a long list doesn’t push the page down
    <div className="max-h-72 overflow-y-auto pr-1">
      <ul className="space-y-3">
        {incoming.map((r) => (
          <li
            key={r.id}
            className="grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-lg border bg-white px-3 py-2"
          >
            <img
              src={
                r.fromProfileImage
                  ? `${API_BASE_URL}/uploads/${r.fromProfileImage}`
                  : `${API_BASE_URL}/uploads//profile/defaultavatar.png`
              }
              alt={r.fromUsername}
              className="h-10 w-10 rounded-full object-cover"
            />

            {/* name column – truncate to avoid wrapping under buttons */}
            <div className="min-w-0">
              <div className="font-medium truncate">{r.fromUsername}</div>
            </div>

            {/* actions – fixed on the right */}
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" onClick={() => respondRequest(r.id, 'accepted')}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => respondRequest(r.id, 'declined')}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
