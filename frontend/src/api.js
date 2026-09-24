// Base URL for the backend API.
// - Local dev: proxied through Vite (see vite.config.js), so '' works.
// - Production build: set VITE_API_BASE_URL at build time to the ALB/API
//   Gateway URL (e.g. https://api.technexus.example.com), injected by
//   CodeBuild for each environment (Dev/UAT) via environment variables.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listCompanies: () => request('/companies'),
  getCompany: (id) => request(`/companies/${id}`),
  createCompany: (data) => request('/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompany: (id, data) => request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCompany: (id) => request(`/companies/${id}`, { method: 'DELETE' }),
  enrichCompany: (name, doc) => request('/companies/enrich', { method: 'POST', body: JSON.stringify({ name, doc }) }),
};
