// src/services/adminPackagesService.ts
export type PackageRow = {
    package_id: number;
    name: string;
    price: string;            // varchar in DB
    period_num: number;
    period: "day" | "month" | "year";
    color: string;
    icon: string;
    package_permissions_group_id: number;
    allowed_blogs_categories: number;
    allowed_videos_categories: number;
    allowed_products: number;
    verification_badge_enabled: "0" | "1" | boolean;
    boost_posts_enabled: "0" | "1" | boolean;
    boost_posts: number;
    boost_pages_enabled: "0" | "1" | boolean;
    boost_pages: number;
    custom_description: string | null;
    package_order: number;
    paypal_billing_plan?: string | null;
    stripe_billing_plan?: string | null;
  };
  
  const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";
  
  export async function listPackages(
    headers: Record<string, string>,
    opts: { page?: number; pageSize?: number; search?: string; sort?: string; order?: "asc" | "desc" } = {}
  ) {
    const qs = new URLSearchParams();
    Object.entries(opts).forEach(([k, v]) => v !== undefined && v !== null && v !== "" && qs.set(k, String(v)));
    const r = await fetch(`${API}/api/admin/packages?${qs}`, { headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ items: PackageRow[]; page: number; pageSize: number; total: number; totalPages: number }>;
  }
  
  export async function getPackage(headers: Record<string, string>, id: number) {
    const r = await fetch(`${API}/api/admin/packages/${id}`, { headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<PackageRow>;
  }
  
  export async function createPackage(headers: Record<string, string>, data: FormData) {
    const r = await fetch(`${API}/api/admin/packages`, { method: "POST", headers, body: data });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ ok: true; id: number }>;
  }
  
  export async function updatePackage(headers: Record<string, string>, id: number, data: FormData) {
    const r = await fetch(`${API}/api/admin/packages/${id}`, { method: "PUT", headers, body: data });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ ok: true }>;
  }
  
  export async function deletePackage(headers: Record<string, string>, id: number) {
    const r = await fetch(`${API}/api/admin/packages/${id}`, { method: "DELETE", headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ ok: true }>;
  }
  