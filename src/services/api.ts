const BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://multi-clinic-token-management.onrender.com' : '');

function headers(token?: string | null) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function handle(res: Response) {
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(e.error || 'Request failed');
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string) {
  return handle(await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ email, password })
  }));
}

// ─── Public Clinic APIs ───────────────────────────────────────────────────────

export async function fetchHomeSummary() {
  return handle(await fetch(`${BASE}/api/clinics/summary`));
}

export async function fetchTop3Clinics() {
  return handle(await fetch(`${BASE}/api/clinics/top3`));
}

export async function fetchFeaturedClinics() {
  return handle(await fetch(`${BASE}/api/clinics/featured`));
}

export async function searchClinics(q: string) {
  return handle(await fetch(`${BASE}/api/clinics/search?q=${encodeURIComponent(q)}`));
}

export async function fetchClinic(clinicId: string) {
  return handle(await fetch(`${BASE}/api/clinics/${clinicId}`));
}

export async function fetchClinicQueue(clinicId: string) {
  return handle(await fetch(`${BASE}/api/clinics/${clinicId}/queue`));
}

export async function bookToken(data: { clinicId: string; name: string; phone: string; age?: number; department?: string }) {
  return handle(await fetch(`${BASE}/api/tokens`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data)
  }));
}

// ─── Protected APIs (need token) ─────────────────────────────────────────────

export async function fetchClinics(token: string) {
  return handle(await fetch(`${BASE}/api/clinics`, { headers: headers(token) }));
}

export async function createClinic(data: any, token: string) {
  return handle(await fetch(`${BASE}/api/clinics`, {
    method: 'POST', headers: headers(token), body: JSON.stringify(data)
  }));
}

export async function updateClinic(clinicId: string, data: any, token: string) {
  return handle(await fetch(`${BASE}/api/clinics/${clinicId}`, {
    method: 'PUT', headers: headers(token), body: JSON.stringify(data)
  }));
}

export async function deleteClinic(clinicId: string, token: string) {
  return handle(await fetch(`${BASE}/api/clinics/${clinicId}`, {
    method: 'DELETE', headers: headers(token)
  }));
}

export async function setFeatured(clinicId: string, featured: boolean, token: string) {
  return handle(await fetch(`${BASE}/api/clinics/${clinicId}/featured`, {
    method: 'PUT', headers: headers(token), body: JSON.stringify({ featured })
  }));
}

export async function callNextPatient(clinicId: string, token: string) {
  return handle(await fetch(`${BASE}/api/clinics/${clinicId}/next`, {
    method: 'POST', headers: headers(token)
  }));
}

export async function resetClinicQueue(clinicId: string, token: string) {
  return handle(await fetch(`${BASE}/api/clinics/${clinicId}/reset`, {
    method: 'POST', headers: headers(token)
  }));
}

export async function fetchAdminSummary(token: string) {
  return handle(await fetch(`${BASE}/api/admin/summary`, { headers: headers(token) }));
}

export async function fetchClinicStats(clinicId: string, token: string) {
  return handle(await fetch(`${BASE}/api/clinics/${clinicId}/stats`, { headers: headers(token) }));
}
