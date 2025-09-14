const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8085";

export async function adminListAds(
  params: { status: "pending" | "approved"; page?: number; limit?: number; search?: string },
  headers: HeadersInit
) {
  const q = new URLSearchParams({
    status: params.status,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    search: params.search ?? "",
  });
  const r = await fetch(`${API}/api/admin/ads?${q.toString()}`, { headers });
  return r.json();
}

export async function adminApproveAd(id: number, headers: HeadersInit) {
  const r = await fetch(`${API}/api/admin/ads/${id}/approve`, { method: "POST", headers });
  return r.json();
}

export async function adminDeclineAd(id: number, headers: HeadersInit) {
  const r = await fetch(`${API}/api/admin/ads/${id}/decline`, { method: "POST", headers });
  return r.json();
}

export async function adminToggleActive(id: number, active: boolean, headers: HeadersInit) {
  const r = await fetch(`${API}/api/admin/ads/${id}/active`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers as any) },
    body: JSON.stringify({ active }),
  });
  return r.json();
}

export async function adminDeleteAd(id: number, headers: HeadersInit) {
  const r = await fetch(`${API}/api/admin/ads/${id}`, { method: "DELETE", headers });
  return r.json();
}

export async function adminGetAd(id: number, headers: HeadersInit) {
  const r = await fetch(`${API}/api/admin/ads/${id}`, { headers });
  return r.json();
}
