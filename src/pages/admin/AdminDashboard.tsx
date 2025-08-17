// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { useAuthHeader } from '@/hooks/useAuthHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Users as UsersIcon, Clock, Mail, MinusCircle } from 'lucide-react';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

type AdminStats = {
  totalUsers: number;
  pendingUsers: number;
  notActivated: number;
  banned: number;
  posts?: number;
};

function StatCard({
  title,
  value,
  gradient,
  Icon,
}: {
  title: string;
  value: number | string;
  gradient: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl px-6 py-7 text-white shadow-sm bg-gradient-to-tr ${gradient}`}
    >
      {/* soft pattern circle on the right */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/20" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-28 w-28 rounded-full bg-white/10" />

      <div className="flex items-start justify-between">
        <div>
          <div className="text-5xl font-extrabold leading-none">{value}</div>
          <div className="mt-2 text-xl font-semibold opacity-95">{title}</div>
        </div>
        <div className="shrink-0">
          <div className="grid place-items-center h-14 w-14 rounded-2xl bg-white/15">
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    fetch(`${API_BASE_URL}/api/admin/stats`, { headers })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load stats');
        return r.json();
      })
      .then((data) => {
        // Be tolerant to different field names coming from the API
        const normalized: AdminStats = {
          totalUsers:
            data.totalUsers ?? data.users ?? data.userCount ?? 0,
          pendingUsers:
            data.pendingUsers ?? data.pending ?? data.pendingCount ?? 0,
          notActivated:
            data.notActivated ??
            data.unverified ??
            data.notActivatedUsers ??
            0,
          banned:
            data.banned ?? data.suspended ?? data.blocked ?? 0,
          posts: data.posts ?? data.totalPosts,
        };
        setStats(normalized);
      })
      .catch(console.error);
  }, [accessToken]); // don't include `headers` to avoid re-fetch loops

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Users"
          value={stats ? stats.totalUsers : '—'}
          gradient="from-indigo-500 to-blue-500"
          Icon={UsersIcon}
        />
        <StatCard
          title="Pending Users"
          value={stats ? stats.pendingUsers : '—'}
          gradient="from-orange-400 to-amber-500"
          Icon={Clock}
        />
        <StatCard
          title="Not Activated"
          value={stats ? stats.notActivated : '—'}
          gradient="from-rose-500 to-pink-500"
          Icon={Mail}
        />
        <StatCard
          title="Banned"
          value={stats ? stats.banned : '0'}
          gradient="from-red-500 to-rose-700"
          Icon={MinusCircle}
        />
      </div>

      {/* (Optional) add more sections below, e.g. tiny charts, latest reports, etc. */}
    </div>
  );
}
