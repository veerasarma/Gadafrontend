// src/services/paymentService.ts
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';
export interface InitializeResponse {
    authorization_url: string;
    access_code: string;
    reference: string;
  }
  
  export async function initializePayment(
    email: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<InitializeResponse> {
    const res = await fetch(API_BASE_URL+'/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amount, metadata })
    });
    if (!res.ok) throw new Error('Payment initialization failed');
    return res.json();
  }

  export interface Transaction {
    id: number;
    amount: number;
    type: string;
    status: string;
    createdAt: string;
  }
  export type Balance = {
    user_wallet_balance: number;
    user_points: number;
  };
  
  
  export async function fetchTransactions(
    headers: Record<string,string>,
    start?: string,
    end?: string
  ): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end)   params.set('end',   end);
  
    const res = await fetch(API_BASE_URL+`/api/payments/transactions?${params}`, { headers });
    if (!res.ok) throw new Error('Failed to load transactions');
    return res.json();
  }
  
  
  export async function fetchBalance(
    headers: Record<string,string>
  ): Promise<Balance> {
  
    // const res = await fetch(API_BASE_URL+`/api/users/fetchbalance`, { headers });
    // if (!res.ok) throw new Error('Failed to load transactions');
    // return res.json();

    const res = await fetch(`${API_BASE_URL}/api/users/fetchuserbalance`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
  
    if (!res.ok) {
      const msg = await res.text().catch(() => 'Failed to load balance');
      throw new Error(msg || 'Failed to load balance');
    }
  
    const raw = (await res.json()) as {
      user_wallet_balance: number | string;
      user_points: number | string;
    };
  
    return {
      user_wallet_balance: Number(raw.user_wallet_balance) || 0,
      user_points: Number(raw.user_points) || 0,
    };
  }
  
  