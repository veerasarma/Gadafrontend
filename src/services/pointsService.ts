// src/services/pointsService.ts
export type PointsRules = {
    post_create: number;
    post_view: number;
    post_comment: number;
    follow: number;
    refer: number;
    daily_limit: number;
    conversion: { pointsPerNaira: number; nairaPerPoint: number };
  };
  
  export type PointsOverview = {
    rules: PointsRules;
    balances: { points: number; money: number };
    remainingToday: number;
    windowHours: number;
  };
  
  export type PointsRow = {
    id: number;
    points: number;
    from: string;
    nodeId: number;
    nodeType: string;
    time: string; // ISO
  };
  
  export type PointsPage = {
    page: number;
    pageSize: number;
    total: number;
    rows: PointsRow[];
  };
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';
  
  export async function getPointsOverview(headers: Record<string, string>): Promise<PointsOverview> {
    const r = await fetch(`${API_BASE_URL}/api/points/overview`, { headers, credentials: 'include' });
    if (!r.ok) throw new Error('Failed to load points overview');
    return r.json();
  }
  
  export async function getPointsLogs(
    headers: Record<string, string>,
    opts: { page?: number; limit?: number; q?: string; sort?: 'time' | 'points' | 'node_id'; dir?: 'asc' | 'desc' } = {}
  ): Promise<PointsPage> {
    const { page = 1, limit = 10, q = '', sort = 'time', dir = 'desc' } = opts;
    const qs = new URLSearchParams({ page: String(page), limit: String(limit), q, sort, dir });
    const r = await fetch(`${API_BASE_URL}/api/points/logs?${qs.toString()}`, { headers, credentials: 'include' });
    if (!r.ok) throw new Error('Failed to load transactions');
    return r.json();
  }
  