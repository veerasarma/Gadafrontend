import { useState } from 'react';
import { useFriends } from '@/contexts/FriendContext';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { searchUsers } from '@/services/friendService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface SearchResult {
  id: string;
  username: string;
  profileImage?: string;
}

export function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const { sendRequest } = useFriends();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const users = await searchUsers(query, headers);
      setResults(users);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <form onSubmit={handleSearch} className="flex space-x-2 mb-4">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Find friends"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </form>
      <div className="space-y-3">
        {results.map(u => (
          <div
            key={u.user_id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                {u.profileImage ? (
                  <AvatarImage src={(u.profileImage)} />
                ) : (
                  <AvatarFallback>{u.user_name[0].toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <span>{u.user_name}</span>
            </div>
            <Button size="sm" onClick={() => sendRequest(u.user_id)}>
              Add Friend
            </Button>
          </div>
        ))}
        {results.length === 0 && !loading && (
          <p className="text-gray-500 text-sm">No users found.</p>
        )}
      </div>
    </div>
  );
}
