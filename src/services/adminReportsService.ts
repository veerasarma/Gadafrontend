// src/services/adminReportsService.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

export async function listReports(headers: HeadersInit, page = 1, limit = 10, q = "") {
  const url = new URL(`${API_BASE}/api/admin/reports`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (q.trim()) url.searchParams.set("q", q.trim());

  const r = await fetch(url.toString(), { headers });
  return r.json();
}

export async function markReportSafe(headers: HeadersInit, id: number) {
  const r = await fetch(`${API_BASE}/api/admin/reports/${id}/mark-safe`, { method: "POST", headers });
  return r.json();
}

export async function deleteReport(headers: HeadersInit, id: number) {
  const r = await fetch(`${API_BASE}/api/admin/reports/${id}`, { method: "DELETE", headers });
  return r.json();
}

export async function markAllReportsSafe(headers: HeadersInit) {
  const r = await fetch(`${API_BASE}/api/admin/reports/bulk/mark-safe`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [] }),
  });
  return r.json();
}
