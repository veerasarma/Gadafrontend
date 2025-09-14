// src/services/adsService.ts
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8085"; // e.g., http://localhost:3000

export type Campaign = {
  campaign_id: number;
  campaign_title: string;
  campaign_start_date: string;
  campaign_end_date: string;
  campaign_budget: number;
  campaign_spend: number;
  campaign_bidding: "click" | "view";
  audience_countries: string;
  audience_gender: string;
  audience_relationship: string;
  ads_title: string | null;
  ads_description: string | null;
  ads_type: string;
  ads_url: string | null;
  ads_post_url: string | null;
  ads_page: number | null;
  ads_group: number | null;
  ads_event: number | null;
  ads_placement: "newsfeed" | "sidebar";
  ads_image: string;
  campaign_created_date: string;
  campaign_is_active: "0" | "1";
  campaign_is_approved: "0" | "1";
  campaign_is_declined: "0" | "1";
  campaign_views: number;
  campaign_clicks: number;
};

export async function uploadAdImage(file: File, headers: any) {
  const fd = new FormData();
  fd.append("image", file);
  const r = await fetch(`${API}/api/ads/upload`, {
    method: "POST",
    credentials: "include",
    headers,
    body: fd,
  });
  return r.json();
}

export async function createCampaign(payload: any, headers: any) {
  const r = await fetch(`${API}/api/ads/campaigns`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function myCampaigns(page = 1, limit = 10, headers: any) {
  const r = await fetch(`${API}/api/ads/campaigns?page=${page}&limit=${limit}`, {
    credentials: "include",
    headers,
  });
  return r.json();
}

export async function setActive(id: number, active: boolean, headers: any) {
  const r = await fetch(`${API}/api/ads/campaigns/${id}/status`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ active }),
  });
  return r.json();
}

export async function serveAd(
  q: { placement: "newsfeed" | "sidebar"; country_id?: string | number; gender?: string; relationship?: string },
  headers?: any
) {
  const p = new URLSearchParams(q as any).toString();
  const r = await fetch(`${API}/api/ads/serve?${p}`, {
    headers,
  });
  return r.json();
}

export async function trackView(id: number, headers?: any) {
  return fetch(`${API}/api/ads/${id}/track-view`, {
    method: "POST",
    headers,
  }).then((r) => r.json());
}

export async function trackClick(id: number, headers?: any) {
  return fetch(`${API}/api/ads/${id}/track-click`, {
    method: "POST",
    headers,
  }).then((r) => r.json());
}

export async function getCountries(headers?: any) {
  const r = await fetch(
    `${(import.meta as any).env.VITE_API_BASE_URL ?? "http://localhost:8085"}/api/ads/countries`,
    { headers: { ...(headers || {}) } }
  );
  return r.json();
}

export async function updateCampaign(id: number, payload: any, headers: any) {
  const r = await fetch(`${API}/api/ads/campaigns/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function deleteCampaign(id: number, headers: any) {
  const r = await fetch(`${API}/api/ads/campaigns/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { ...(headers || {}) },
  });
  return r.json();
}

export async function getAudienceHints(headers?: any) {
  const r = await fetch(`${API}/api/ads/whoami`, { headers: { ...(headers || {}) }, credentials: "include" });
  return r.json(); // { ok, country_id, gender, relationship }
}
