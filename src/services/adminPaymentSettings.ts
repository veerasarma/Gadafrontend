// src/services/adminPaymentSettings.ts
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8085";

export type PaymentSettings = {
  bank_transfers_enabled: boolean;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  bank_account_country: string;
  bank_transfer_note: string;

  payment_fees_enabled: boolean;
  payment_fees_percentage: number;

  payment_vat_enabled: boolean;
  payment_country_vat_enabled: boolean;
  payment_vat_percentage: number;

  paystack_enabled: boolean;
  paystack_secret: string;
};

export async function getPaymentSettings(headers: Record<string, string>) {
  const res = await fetch(`${API}/api/admin/payment-settings`, { headers });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return json.data as Partial<PaymentSettings>;
}

export async function saveFees(
  headers: Record<string, string>,
  payload: { payment_fees_enabled: boolean; payment_fees_percentage: number }
) {
  const res = await fetch(`${API}/api/admin/payment-settings/fees`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveVat(
  headers: Record<string, string>,
  payload: {
    payment_vat_enabled: boolean;
    payment_country_vat_enabled: boolean;
    payment_vat_percentage: number;
  }
) {
  const res = await fetch(`${API}/api/admin/payment-settings/vat`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveBank(
  headers: Record<string, string>,
  payload: {
    bank_transfers_enabled: boolean;
    bank_name: string;
    bank_account_number: string;
    bank_account_name: string;
    bank_account_country: string;
    bank_transfer_note: string;
  }
) {
  const res = await fetch(`${API}/api/admin/payment-settings/bank`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function savePaystack(
  headers: Record<string, string>,
  payload: { paystack_enabled: boolean; paystack_secret: string }
) {
  const res = await fetch(`${API}/api/admin/payment-settings/paystack`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
