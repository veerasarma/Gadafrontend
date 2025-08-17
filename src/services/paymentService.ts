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
  export interface Balance {
    balance: number;
  }
  
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
    headers: Record<string,string>,
  ): Promise<Balance> {
  
    const res = await fetch(API_BASE_URL+`/api/users/fetchbalance`, { headers });
    if (!res.ok) throw new Error('Failed to load transactions');
    return res.json();
  }
  
  