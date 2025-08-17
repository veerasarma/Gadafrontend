import { useFriends } from '@/contexts/FriendContext';
import { User } from '@/services/friendService';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export function FriendList() {
  const { friends } = useFriends();
  if (friends.length === 0) {
    return <p className="p-4 text-gray-500">You have no friends yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {friends.map((f: User) => (
        <Link
          key={f.id}
          to={`/profile/${f.id}`}
          className="flex flex-col items-center hover:bg-gray-100 p-2 rounded"
        >
          <Avatar className="h-16 w-16">
            {f.profileImage ? (
              <AvatarImage src={(API_BASE_URL+'/uploads/'+f.profileImage)} />
            ) : (
              <AvatarFallback>
                {f.user_name[0].toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="mt-2 text-sm text-gray-800">{f.user_name}</span>
        </Link>
      ))}
    </div>
  );
}
