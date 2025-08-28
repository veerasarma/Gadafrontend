// src/services/adminSettingsService.ts
export type WalletSettings = {
    wallet_min_withdrawal: number | null;
    wallet_max_transfer: number | null;
    wallet_withdrawal_enabled: boolean;
  };
  
  const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";
  
  export async function getWalletSettings(headers: Record<string, string>): Promise<WalletSettings> {
    const res = await fetch(`${API}/api/admin/wallet-settings`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  
  export async function updateWalletSettings(
    headers: Record<string, string>,
    payload: WalletSettings
  ): Promise<{ ok: true }> {
    const res = await fetch(`${API}/api/admin/wallet-settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  

  export type PointsSettings = {
    points_enabled: boolean;
    points_limit_pro: number;
    points_limit_user: number;
    points_min_withdrawal: number;
    points_money_transfer_enabled: boolean;
    points_per_comment: number;
    points_per_currency: number;
    points_per_follow: number;
    points_per_post: number;
    points_per_post_comment: number;
    points_per_post_reaction: number;
    points_per_post_view: number;
    points_per_reaction: number;
  };
  
  export async function getPointsSettings(headers: Record<string, string>) {
    const r = await fetch(`${API}/api/admin/settings/points/fetch`, {   headers: { "Content-Type": "application/json", ...headers }, });
    if (!r.ok) throw new Error(await r.text());
    return (await r.json()) as PointsSettings;
  }
  
  export async function savePointsSettings(headers: Record<string, string>, data: PointsSettings) {
    const r = await fetch(`${API}/api/admin/settings/points/update`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ ok: true }>;
  }