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
  signup: (name, email, password, role, phone, address) => apiRequest('/api/auth/signup', { method: 'POST', body: { name, email, password, role, phone, address } }),
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

export const SubscriptionAPI = {
  getPlans: () => apiRequest('/api/subscriptions/plans'),
  create: (data, token) => apiRequest('/api/subscriptions', { method: 'POST', token, body: data }),
  getMySubscriptions: (token) => apiRequest('/api/subscriptions/my-subscriptions', { token }),
  cancel: (id, token) => apiRequest(`/api/subscriptions/${id}/cancel`, { method: 'POST', token }),
  getDetails: (id, token) => apiRequest(`/api/subscriptions/${id}`, { token }),
};

export const StaffAPI = {
  getAll: (token) => apiRequest('/api/staff', { token }),
  create: (data, token) => apiRequest('/api/staff', { method: 'POST', token, body: data }),
  getDetails: (id, token) => apiRequest(`/api/staff/${id}`, { token }),
  update: (id, data, token) => apiRequest(`/api/staff/${id}`, { method: 'PUT', token, body: data }),
  assign: (staffId, data, token) => apiRequest(`/api/staff/${staffId}/assign`, { method: 'POST', token, body: data }),
  getAssignments: (staffId, token) => apiRequest(`/api/staff/${staffId}/assignments`, { token }),
  updateAssignment: (assignmentId, data, token) => apiRequest(`/api/staff/assignments/${assignmentId}`, { method: 'PUT', token, body: data }),
  delete: (id, token) => apiRequest(`/api/staff/${id}`, { method: 'DELETE', token }),
};

export const MaintenanceAPI = {
  create: (data, token) => apiRequest('/api/maintenance', { method: 'POST', token, body: data }),
  getMyMaintenance: (params, token) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/maintenance/my-maintenance?${queryString}`, { token });
  },
  getStaffAssignments: (params, token) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/maintenance/staff-assignments?${queryString}`, { token });
  },
  getAll: (params, token) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/maintenance/all?${queryString}`, { token });
  },
  assignStaff: (id, data, token) => apiRequest(`/api/maintenance/${id}/assign-staff`, { method: 'POST', token, body: data }),
  updateStatus: (id, data, token) => apiRequest(`/api/maintenance/${id}/status`, { method: 'PUT', token, body: data }),
  addImages: (id, data, token) => apiRequest(`/api/maintenance/${id}/images`, { method: 'POST', token, body: data }),
  getDetails: (id, token) => apiRequest(`/api/maintenance/${id}`, { token }),
  addFeedback: (id, data, token) => apiRequest(`/api/maintenance/${id}/feedback`, { method: 'POST', token, body: data }),
};

export const SearchAPI = {
  searchProperties: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/search/properties?${queryString}`);
  },
  getSuggestions: (q) => apiRequest(`/api/search/suggestions?q=${encodeURIComponent(q)}`),
  getPopular: () => apiRequest('/api/search/popular'),
  getFilters: () => apiRequest('/api/search/filters'),
  getNearby: (lat, lng, radius) => apiRequest(`/api/search/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
};


