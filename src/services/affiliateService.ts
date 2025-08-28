// src/services/affiliateService.ts
import { HeadersInit } from 'react';

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085';

export async function getAffOverview(headers: HeadersInit) {
  const r = await fetch(`${API}/api/affiliates/overview`, { headers });
  if (!r.ok) throw new Error('overview failed');
  return r.json();
}

export async function getAffReferrals(
  headers: HeadersInit,
  opts: { page?: number; limit?: number; level?: number; search?: string } = {}
) {
  const q = new URLSearchParams();
  if (opts.page)  q.set('page', String(opts.page));
  if (opts.limit) q.set('limit', String(opts.limit));
  if (opts.level) q.set('level', String(opts.level));
  if (opts.search) q.set('search', opts.search);
  const r = await fetch(`${API}/api/affiliates/referrals?` + q.toString(), { headers });
  if (!r.ok) throw new Error('referrals failed');
  return r.json();
}

export async function affTransfer(headers: HeadersInit, amount: number) {
  const r = await fetch(`${API}/api/affiliates/transfer`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
