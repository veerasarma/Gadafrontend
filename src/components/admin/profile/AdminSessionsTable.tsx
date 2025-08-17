import { useEffect, useState } from 'react';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminSessions, revokeAdminSession, AdminSession } from '@/services/adminProfile';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function AdminSessionsTable() {
    const {accessToken} = useAuth();
  const headers = useAuthHeader(accessToken);
  const [items, setItems] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchAdminSessions(headers));
    } catch (e:any) {
      toast.error('Failed to load sessions', { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const revoke = async (id: string) => {
    try {
      await revokeAdminSession(id, headers);
      toast.success('Session revoked');
      setItems(prev => prev.filter(s => s.id !== id));
    } catch (e:any) {
      toast.error('Failed', { description: e?.message });
    }
  };

  if (loading) return <div>Loading…</div>;
  if (!items.length) return <div className="text-gray-500">No other active sessions.</div>;

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Last Seen</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(s => (
            <TableRow key={s.id}>
              <TableCell className="max-w-[320px] truncate">{s.userAgent}</TableCell>
              <TableCell>{s.ip}</TableCell>
              <TableCell>{new Date(s.lastSeen || s.createdAt).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <Button variant="destructive" size="sm" onClick={() => revoke(s.id)}>
                  Revoke
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
