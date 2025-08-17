// src/components/groups/GroupCard.tsx
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import type { Group }  from '@/services/groupService';

type Props = {
  g: Group;
  onJoin: (id: number) => void;
  onLeave: (id: number) => void;
};

export default function GroupCard({ g, onJoin, onLeave }: Props) {
  const joined = g.joined === '1';
  const pending = joined && g.approved === '0';

  const picture = g.group_picture
    ? g.group_picture.startsWith('http')
      ? g.group_picture
      : `/uploads/${g.group_picture.replace(/^\/+/, '')}`
    : null;

  return (
    <div className="rounded-xl bg-white shadow p-4 flex flex-col">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-200 to-blue-200 overflow-hidden flex items-center justify-center">
          {picture ? (
            <img src={picture} alt={g.group_title} className="h-full w-full object-cover" />
          ) : (
            <Users className="h-7 w-7 text-purple-700" />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{g.group_title || g.group_name}</div>
          <div className="text-xs text-gray-500">{g.group_members} Members</div>
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-600 line-clamp-2">{g.group_description}</p>

      <div className="mt-4">
        {!joined ? (
          <Button className="w-full" onClick={() => onJoin(g.group_id)}>Join</Button>
        ) : pending ? (
          <Button className="w-full" variant="secondary" disabled>Pending approval</Button>
        ) : (
          <Button className="w-full" variant="outline" onClick={() => onLeave(g.group_id)}>Joined</Button>
        )}
      </div>
    </div>
  );
}
