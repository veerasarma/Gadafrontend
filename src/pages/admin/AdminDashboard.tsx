// src/pages/admin/AdminDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeader } from "@/hooks/useAuthHeader";
import {
  Users as UsersIcon, Clock, Mail, MinusCircle, UserCheck, Globe,
  FileText, MessageSquare, BookOpen, UsersRound, CalendarDays, MessagesSquare,
  BellRing, BarChart3, LineChart
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

type DashboardStats = {
  totalUsers: number;
  online: number;
  pendingUsers: number;
  notActivated: number;
  banned: number;

  totalVisits: number;
  todayVisits: number;
  monthVisits: number;

  posts: number;
  comments: number;
  pages: number;
  groups: number;
  events: number;
  messages: number;
  notifications: number;
};

type MonthlySeries = {
  year: number;
  users: number[];
  pages: number[];
  groups: number[];
  events: number[];
  posts: number[];
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function StatCard({
  title, value, gradient, Icon,
}: {
  title: string;
  value: number | string;
  gradient: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl px-6 py-7 text-white shadow-sm bg-gradient-to-tr ${gradient}`}>
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

function MiniCard({
  title, value, Icon,
}: {
  title: string;
  value: number | string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-5 flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-600 mt-1">{title}</div>
      </div>
      <div className="h-10 w-10 grid place-items-center rounded-xl bg-slate-50">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  const ready = useMemo(() => "Authorization" in headers, [headers]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthly, setMonthly] = useState<MonthlySeries | null>(null);

  // Load KPI stats
  useEffect(() => {
    if (!ready) return;
    fetch(`${API_BASE_URL}/api/admin/stats`, { headers })
      .then(r => { if (!r.ok) throw new Error("Failed to load stats"); return r.json(); })
      .then(setStats)
      .catch(console.error);
  }, [ready]);

  // Load monthly chart
  useEffect(() => {
    if (!ready) return;
    fetch(`${API_BASE_URL}/api/admin/stats/monthly?year=${year}`, { headers })
      .then(r => { if (!r.ok) throw new Error("Failed to load monthly"); return r.json(); })
      .then(setMonthly)
      .catch(console.error);
  }, [ready, year]);

  // Build chart data
  const chartData = useMemo(() => {
    if (!monthly) return [];
    return MONTHS.map((m, i) => ({
      month: m,
      Users: monthly.users[i] || 0,
      Pages: monthly.pages[i] || 0,
      Groups: monthly.groups[i] || 0,
      Events: monthly.events[i] || 0,
      Posts: monthly.posts[i] || 0,
    }));
  }, [monthly]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
          >
            {[0,1,2,3,4].map(off => {
              const y = new Date().getFullYear() - off;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Monthly Average</h2>
          </div>
        </div>
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* Distinct colors like the screenshot */}
              <Bar dataKey="Users"  fill="#3b82f6" />
              <Bar dataKey="Pages"  fill="#22c55e" />
              <Bar dataKey="Groups" fill="#f59e0b" />
              <Bar dataKey="Events" fill="#ef4444" />
              <Bar dataKey="Posts"  fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Big KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Users"         value={stats?.totalUsers ?? "—"} gradient="from-indigo-500 to-blue-500" Icon={UsersIcon} />
        <StatCard title="Online"        value={stats?.online ?? "—"}      gradient="from-cyan-500 to-sky-500"   Icon={UserCheck} />
        <StatCard title="Pending"       value={stats?.pendingUsers ?? "—"} gradient="from-orange-400 to-amber-500" Icon={Clock} />
        <StatCard title="Not Activated" value={stats?.notActivated ?? "—"} gradient="from-rose-500 to-pink-500" Icon={Mail} />
      </div>

      {/* Second KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Banned" value={stats?.banned ?? "—"} gradient="from-red-500 to-rose-700" Icon={MinusCircle} />
        <MiniCard title="Total Visits"     value={stats?.totalVisits ?? "—"}    Icon={Globe} />
        <MiniCard title="Today Visits"     value={stats?.todayVisits ?? "—"}    Icon={Globe} />
        <MiniCard title="This Month Visits" value={stats?.monthVisits ?? "—"}   Icon={Globe} />
      </div>

      {/* Content blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <MiniCard title="Posts"        value={stats?.posts ?? "—"}        Icon={FileText} />
        <MiniCard title="Comments"     value={stats?.comments ?? "—"}     Icon={MessageSquare} />
        <MiniCard title="Pages"        value={stats?.pages ?? "—"}        Icon={BookOpen} />
        <MiniCard title="Groups"       value={stats?.groups ?? "—"}       Icon={UsersRound} />
        <MiniCard title="Events"       value={stats?.events ?? "—"}       Icon={CalendarDays} />
        <MiniCard title="Messages"     value={stats?.messages ?? "—"}     Icon={MessagesSquare} />
        <MiniCard title="Notifications" value={stats?.notifications ?? "—"} Icon={BellRing} />
      </div>
    </div>
  );
}
