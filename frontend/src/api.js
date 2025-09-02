const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export async function apiRequest(path, { method = 'GET', headers = {}, body, token, isForm = false } = {}) {
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (!isForm) finalHeaders['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const data = await res.json(); msg = data.message || msg; } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export const AuthAPI = {
  login: (email, password) => apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }),
  signup: (name, email, password) => apiRequest('/api/auth/signup', { method: 'POST', body: { name, email, password } }),
};

export const PropertiesAPI = {
  listApproved: () => apiRequest('/api/properties'),
  create: (formData, token) => apiRequest('/api/properties', { method: 'POST', token, body: formData, isForm: true }),
  get: (id) => apiRequest(`/api/properties/${id}`),
  book: (id, payload, token) => apiRequest(`/api/properties/${id}/book`, { method: 'POST', token, body: payload }),
};

export const AdminAPI = {
  listPending: (token) => apiRequest('/api/admin/pending', { token }),
  approve: (id, token) => apiRequest(`/api/admin/${id}/approve`, { method: 'POST', token }),
  reject: (id, token) => apiRequest(`/api/admin/${id}/reject`, { method: 'POST', token }),
  remove: (id, token) => apiRequest(`/api/admin/${id}`, { method: 'DELETE', token }),
};


