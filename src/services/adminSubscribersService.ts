// src/services/adminSubscribersService.ts
export type SubscriberRow = {
    userId: number;
    user: string | null;
    handle: string | null;
    packageName: string;
    packageId: number | null;
    price: number;
    time: string;          // ISO datetime
    subscription: string;  // formatted by SQL
    expiration: string;    // formatted by SQL
    remainingDays: number; // can be negative
    status: "Active" | "Expired";
  };
  
  const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";
  
  export async function listSubscribers(
    headers: Record<string, string>,
    opts: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: "all" | "active" | "expired";
      packageName?: string;
      order?: "newest" | "oldest";
    } = {}
  ) {
    const qs = new URLSearchParams();
    Object.entries(opts).forEach(([k, v]) => v !== undefined && v !== null && v !== "" && qs.set(k, String(v)));
    const r = await fetch(`${API}/api/admin/subscribers?${qs}`, { headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ items: SubscriberRow[]; page: number; pageSize: number; total: number; totalPages: number }>;
  }
  
  export async function exportSubscribersCSV(
    headers: Record<string, string>,
    opts: Parameters<typeof listSubscribers>[1] = {}
  ) {
    const qs = new URLSearchParams();
    Object.entries({ ...opts, export: "csv" }).forEach(([k, v]) => v !== undefined && v !== null && v !== "" && qs.set(k, String(v)));
    const endpoint = `${API}/api/admin/subscribers?${qs}`;
    const r = await fetch(endpoint, { headers });
    if (!r.ok) throw new Error(await r.text());
    const blob = await r.blob();
    return { blob, filename: `subscribers_${Date.now()}.csv` };
  }
  