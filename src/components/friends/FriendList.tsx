import { useEffect, useMemo, useState } from 'react';
import { useFriends } from '@/contexts/FriendContext';
import { User } from '@/services/friendService';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

const PAGE_SIZE = 10;

export function FriendList() {
  const { friends } = useFriends();
  const [page, setPage] = useState(0);

  useEffect(() => {
    // reset to first page if list length changes (e.g., after accept)
    setPage(0);
  }, [friends.length]);

  const pageFriends = useMemo(() => {
    const start = page * PAGE_SIZE;
    return friends.slice(start, start + PAGE_SIZE);
  }, [friends, page]);

  const hasNext = (page + 1) * PAGE_SIZE < friends.length;

  if (friends.length === 0) {
    return <p className="p-4 text-gray-500">You have no friends yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {pageFriends.map((f: User) => {
          const displayName =
            (f as any).user_name || (f as any).username || 'User';
          return (
            <Link
              key={f.id}
              to={`/profile/${f.id}`}
              className="flex flex-col items-center hover:bg-gray-100 p-2 rounded"
            >
              <Avatar className="h-16 w-16">
                {f.profileImage ? (
                  <AvatarImage src={`${API_BASE_URL}/uploads/${f.profileImage}`} />
                ) : (
                  <AvatarFallback>
                    {String(displayName).charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="mt-2 text-sm text-gray-800 text-center line-clamp-1">
                {displayName}
              </span>
            </Link>
          );
        })}
      </div>

      {/* NEXT control only (as requested) */}
      <div className="flex justify-end px-4 pb-4">
        <Button
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNext}
        >
          Next
        </Button>
      </div>
    </>
  );
}
