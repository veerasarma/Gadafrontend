const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";

type HeadersMap = Record<string, string | undefined>;

export async function fetchReportCategories(headers: HeadersMap) {
  const r = await fetch(`${API_BASE}/api/reports/categories`, {
    headers,
    credentials: "include",
  });
  if (!r.ok) throw new Error("Failed to load categories");
  return r.json(); // { ok: true, data: [...] }
}

export async function submitReport(
  params: { nodeId: number; nodeType?: "post"; categoryId: number; reason?: string },
  headers: HeadersMap
) {
  const r = await fetch(`${API_BASE}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    credentials: "include",
    body: JSON.stringify(params),
  });
  if (!r.ok) throw new Error("Failed to submit report");
  return r.json(); // { ok: true } (or { ok: true, deduped: true })
}
