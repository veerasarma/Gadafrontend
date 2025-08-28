// src/services/withdrawService.ts
export type WithdrawRow = {
    id: number;
    amount: string;                 // stored as varchar in table
    method: "bank" | "gada_token";
    transferTo: string;             // method_value
    time: string;                   // ISO/date
    status: -1 | 0 | 1;             // declined / pending / approved
  };
  
  const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";
  
  export async function createWithdrawal(
    headers: Record<string, string>,
    payload: { amount: number; method: "bank" | "gada_token"; transferTo: string }
  ) {
    const res = await fetch(`${API}/api/wallet/withdrawals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  
  export async function fetchWithdrawals(headers: Record<string, string>) {
    const res = await fetch(`${API}/api/wallet/withdrawals`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as WithdrawRow[];
  }
  