// src/lib/http-handle.ts
import { toastBus } from '@/lib/toastBus';
import { tokenStorage } from '@/lib/token';
import { navigateTo } from '@/router/nav';

export class HttpError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function readBodySafe(res: Response) {
  const ct = res.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) return await res.json();
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { message: text }; }
  } catch {
    return null;
  }
}

export async function handle<T>(res: Response): Promise<T> {
  if (res.ok) {
    // 204 no content?
    if (res.status === 204) return undefined as unknown as T;
    return (await res.json()) as T;
  }

  const body = await readBodySafe(res);
  const message = body?.message || res.statusText || 'Request failed';

  if (res.status === 401) {
    tokenStorage.clear();
    toastBus.emit({
      type: 'error',
      title: 'Session expired',
      description: 'Please sign in again.',
    });
    // optional: preserve where user was
    const next = encodeURIComponent(location.pathname + location.search);
    navigateTo(`/login?next=${next}`);
    throw new HttpError(message, 401, body);
  }

  throw new HttpError(message, res.status, body);
}
