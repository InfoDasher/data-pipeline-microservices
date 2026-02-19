import {
  SummaryResponse,
  ProductsResponse,
  HealthResponse,
  IngestResponse,
  AuthResponse,
} from './types';

const INGESTION_URL = process.env.NEXT_PUBLIC_INGESTION_URL || 'http://localhost:3001';
const REPORTING_URL = process.env.NEXT_PUBLIC_REPORTING_URL || 'http://localhost:3003';

let token: string | null = null;

export function setToken(t: string) {
  token = t;
  if (typeof window !== 'undefined') {
    localStorage.setItem('jwt', t);
  }
}

export function getToken(): string | null {
  if (token) return token;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('jwt');
  }
  return token;
}

export function clearToken() {
  token = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwt');
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ── Auth ────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${REPORTING_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data: AuthResponse = await res.json();
  if (data.success) {
    setToken(data.data.token);
  }
  return data;
}

// ── Ingestion ───────────────────────────────────────────

export async function ingestRecords(
  records: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    sale_date: string;
  }>,
): Promise<IngestResponse> {
  const res = await fetch(`${INGESTION_URL}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(records),
  });
  return res.json();
}

// ── Reporting (requires JWT) ────────────────────────────

export async function fetchSummary(params?: {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<SummaryResponse> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  const res = await fetch(`${REPORTING_URL}/api/reports/summary?${qs.toString()}`, {
    headers: await authHeaders(),
  });

  if (res.status === 401) {
    clearToken();
    throw new Error('SESSION_EXPIRED');
  }

  return res.json();
}

export async function fetchProducts(params?: {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  const res = await fetch(`${REPORTING_URL}/api/reports/products?${qs.toString()}`, {
    headers: await authHeaders(),
  });

  if (res.status === 401) {
    clearToken();
    throw new Error('SESSION_EXPIRED');
  }

  return res.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${REPORTING_URL}/api/reports/health`);
  return res.json();
}
