const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8085";

export async function getAdsSettings(headers: HeadersInit) {
  const r = await fetch(`${API}/api/admin/adssettings`, { headers });
  return r.json();
}

export async function saveAdsSettings(data: any, headers: HeadersInit) {
  const r = await fetch(`${API}/api/admin/adssettings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers as any) },
    body: JSON.stringify(data),
  });
  return r.json();
}
