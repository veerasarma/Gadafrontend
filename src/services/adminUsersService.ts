// src/services/adminUsersService.ts
export type AdminUser = {
    id: number;
    username: string;
    email: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    birthdate?: string | null;
    bio?: string;
    website?: string;
    avatar?: string | null;
    cover?: string | null;
    wallet: number;
    points: number;
    membershipRecent?: any[];
  };

  const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";
  
  export async function adminGetUser(headers: Record<string, string>, id: number) {
    const r = await fetch(`${API}/api/admin/users/${id}`, { headers });
    if (!r.ok) throw new Error("Failed to load user");
    const j = await r.json();
    return j.data as AdminUser;
  }
  
  export async function adminUpdateProfile(
    headers: Record<string, string>,
    id: number,
    payload: Partial<AdminUser> & { username?: string; email?: string }
  ) {
    const r = await fetch(`${API}/api/admin/users/${id}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("Failed to update profile");
    return r.json();
  }
  
  export async function adminAdjustBalances(
    headers: Record<string, string>,
    id: number,
    payload: { walletDelta?: number; pointsDelta?: number; reason?: string }
  ) {
    const r = await fetch(`${API}/api/admin/users/${id}/balances`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("Failed to adjust balances");
    return r.json();
  }
  
  export async function adminGetMembership(headers: Record<string, string>, id: number) {
    const r = await fetch(`${API}/api/admin/users/${id}/membership`, { headers });
    if (!r.ok) throw new Error("Failed to load membership");
    return (await r.json())?.data || [];
  }
  
  export async function adminGetMembershipSummary(
      headers: Record<string, string>,
    userId: number,
  ) {
    const r = await fetch(`${API}/api/admin/users/${userId}/membership`, {
      headers,
      credentials: "include",
    });
    if (!r.ok) throw new Error("Failed to fetch membership");
    return r.json(); // { ok: true, data: {...} }
  }
  
  export async function adminListPackages(headers: Record<string, string>) {
    const r = await fetch(`${API}/api/admin/users/packages/list`, {
      headers,
      credentials: "include",
    });
    if (!r.ok) throw new Error("Failed to fetch packages");
    return r.json(); // { ok: true, data: Package[] }
  }
  
  export async function adminUpdateUserPackage(
    headers: Record<string, string>,
    userId: number,
    params: { packageId: number },
  ) {
    const r = await fetch(`${API}/api/admin/users/${userId}/membership/plan`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(params),
    });
    if (!r.ok) throw new Error("Failed to update membership plan");
    return r.json(); // { ok: true }
  }
  
  export async function adminUnsubscribeUser(
    headers: Record<string, string>,
    userId: number,
  ) {
    const r = await fetch(
      `${API}/api/admin/users/${userId}/membership/unsubscribe`,
      {
        method: "POST",
        headers,
        credentials: "include",
      }
    );
    if (!r.ok) throw new Error("Failed to unsubscribe");
    return r.json(); // { ok: true }
  }