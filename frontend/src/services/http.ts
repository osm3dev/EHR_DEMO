/**
 * HTTP implementation of the repository layer. Not wired in by default — the
 * prototype runs fully on local mock data (`@/data/mockdb`). To switch to the
 * Node/PostgreSQL backend, set `VITE_API_BASE` and re-export these functions
 * from `@/services/index.ts` in place of the store-backed ones.
 */
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const httpApi = {
  login: (email: string, password: string) => post('/auth/login', { email, password }),
  patients: () => get('/patients'),
  patient: (id: string) => get(`/patients/${id}`),
  findings: (params?: Record<string, string>) => get(`/findings${params ? `?${new URLSearchParams(params)}` : ''}`),
  finding: (id: string) => get(`/findings/${id}`),
  transitionFinding: (id: string, status: string, note: string, actorId?: string, actorName?: string) =>
    post(`/findings/${id}/transition`, { status, note, actorId, actorName }),
  rules: () => get('/rules'),
  dashboardKpis: () => get('/dashboard/kpis'),
  auditLog: (limit = 100) => get(`/audit?limit=${limit}`),
};
