// src/admin/pages/AdminPackagesEarnings.tsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid,
} from 'recharts';

function naira(n: number) {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₦${(n || 0).toLocaleString()}`;
  }
}

export default function AdminPackagesEarnings() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<{ totalEarnings: number; thisMonthEarnings: number } | null>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [byPackage, setByPackage] = useState<any[]>([]);
  const [series, setSeries] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/admin/earnings/packages?months=12');
        if (!mounted) return;
        setKpis(data.kpis);
        setMonthly(data.monthly);
        setByPackage(data.byPackage);
        setSeries(data.packageNames || Array.from(new Set(data.byPackage?.map((p: any) => p.packageName))));
      } catch (e) {
        console.error('[AdminPackagesEarnings]', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const lines = useMemo(() => {
    // Generate a color per series (stable, but simple)
    const palette = ['#6D28D9', '#2563EB', '#059669', '#DC2626', '#D97706', '#0EA5E9'];
    return series.map((name, i) => ({ name, stroke: palette[i % palette.length] }));
  }, [series]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Earnings • Packages</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 bg-gradient-to-r from-purple-700 to-fuchsia-500 text-white shadow">
          <div className="text-sm opacity-90 mb-1">Total Earnings</div>
          <div className="text-3xl font-bold">{kpis ? naira(kpis.totalEarnings) : '—'}</div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow">
          <div className="text-sm opacity-90 mb-1">This Month Earnings</div>
          <div className="text-3xl font-bold">{kpis ? naira(kpis.thisMonthEarnings) : '—'}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="text-sm font-medium mb-3">Packages</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ym" />
              <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v/1000)}k` : v)} />
              <Tooltip formatter={(v: any) => naira(Number(v))} />
              <Legend />
              {lines.map(l => (
                <Line key={l.name} type="monotone" dataKey={l.name} stroke={l.stroke} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Packages</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 px-3">Package</th>
                <th className="py-2 px-3">Total Sales</th>
                <th className="py-2 px-3">Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              {byPackage.map((r: any) => (
                <tr key={r.packageName} className="border-t">
                  <td className="py-2 px-3 font-medium">{r.packageName}</td>
                  <td className="py-2 px-3">{r.totalSales?.toLocaleString?.() ?? r.totalSales}</td>
                  <td className="py-2 px-3">{naira(r.totalEarnings)}</td>
                </tr>
              ))}
              {!loading && byPackage.length === 0 && (
                <tr><td className="py-6 px-3 text-gray-500" colSpan={3}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
