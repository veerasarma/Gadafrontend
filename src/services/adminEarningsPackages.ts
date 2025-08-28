// src/services/adminEarningsPackages.ts
export type SeriesRow = { package_name: string; data: number[] }; // 12 months
export type SummaryResp = {
  year: number;
  series: SeriesRow[];
  totalAll: number;
  totalThisMonth: number;
};

export type TableResp = {
  items: { package_id: number; package: string; total_sales: number; total_earnings: number }[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

export async function getPackagesSummary(
  headers: Record<string, string>,
  opts: { year?: number; month?: number } = {}
): Promise<SummaryResp> {
  const qs = new URLSearchParams();
  if (opts.year) qs.set("year", String(opts.year));
  if (opts.month) qs.set("month", String(opts.month));
  const res = await fetch(`${API}/api/admin/earnings/packages/summary?${qs}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPackagesTable(
  headers: Record<string, string>,
  opts: { search?: string; page?: number; pageSize?: number; startDate?: string; endDate?: string; sort?: "name" | "sales" | "earnings"; order?: "asc" | "desc"; } = {}
): Promise<TableResp> {
  const qs = new URLSearchParams();
  Object.entries(opts).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const res = await fetch(`${API}/api/admin/earnings/packages/table?${qs}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
