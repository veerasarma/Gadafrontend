// src/components/messenger/NewChatModal.tsx
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { stripUploads } from '@/lib/url';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

type Person = { id:number; username:string; fullName:string; avatar?:string|null };

export default function NewChatModal({
  open,
  onOpenChange,
  onPick,
  search,
}: {
  open: boolean;
  onOpenChange: (o:boolean) => void;
  onPick: (p:Person) => void;
  search: (q:string) => Promise<Person[]>;
}) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Person[]>([]);
  const abortRef = useRef<AbortController|null>(null);
  const tRef = useRef<number|undefined>();

  useEffect(() => {
    if (!open) { setQ(''); setItems([]); return; }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const qq = q.trim();
    if (tRef.current) clearTimeout(tRef.current);
    if (abortRef.current) abortRef.current.abort();
    if (qq.length < 2) { setItems([]); setBusy(false); return; }

    setBusy(true);
    tRef.current = window.setTimeout(async () => {
      try {
        abortRef.current = new AbortController();
        const res = await search(qq);
        setItems(res);
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [q, open, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people"
            autoFocus
          />
          {busy && <div className="text-sm text-gray-500">Searching…</div>}
          <div className="max-h-80 overflow-y-auto">
            {items.map(p => (
              <button
                key={p.id}
                className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 text-left"
                onClick={() => onPick(p)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={p.avatar ? API_BASE_URL + '/uploads/' + stripUploads(p.avatar) : ''} />
                  <AvatarFallback>{(p.fullName || p.username).slice(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{p.fullName || p.username}</div>
                  <div className="text-xs text-gray-500">@{p.username}</div>
                </div>
              </button>
            ))}
            {!busy && items.length === 0 && q.trim().length >= 2 && (
              <div className="text-sm text-gray-500 px-2 py-4">No people found</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
