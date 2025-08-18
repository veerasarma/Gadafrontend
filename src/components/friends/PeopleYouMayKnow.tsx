import { useFriends } from '@/contexts/FriendContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export function PeopleYouMayKnow() {
  const { suggestions, sendRequest } = useFriends();
console.log(suggestions,'suggestionssuggestions')
  if (suggestions.length === 0) {
    return null; // or a “no suggestions” message
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      {/* <h2 className="text-lg font-semibold mb-3">People You May Know</h2> */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {suggestions.map(user => (
          <div key={user.id} className="text-center space-y-2">
            <Avatar className="h-16 w-16 mx-auto">
              {user?.profileImage ? (
                <AvatarImage src={(user?.profileImage?API_BASE_URL+'/uploads/'+user.profileImage:API_BASE_URL+'/uploads//profile/defaultavatar.png')} />
              ) : (
                // <AvatarFallback>
                //   {user.user_name[0].toUpperCase()}
                // </AvatarFallback>
                <AvatarImage src={(API_BASE_URL+'/uploads//profile/defaultavatar.png')} />
              )}
            </Avatar>
            <div className="text-sm font-medium">{user.user_name}</div>
            <Button
              size="sm"
              onClick={() => sendRequest(user.user_id)}
              className="w-full"
            >
              Add Friend
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
