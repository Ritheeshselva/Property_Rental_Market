const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export async function apiRequest(path, { method = 'GET', headers = {}, body, token, isForm = false } = {}) {
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (!isForm) finalHeaders['Content-Type'] = 'application/json';

  const requestBody = isForm ? body : body ? JSON.stringify(body) : undefined;
  console.log('API Request:', {
    url: `${API_BASE}${path}`,
    method,
    headers: finalHeaders,
    body: requestBody
  });

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: requestBody,
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const data = await res.json(); msg = data.message || msg; } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type') || '';
  let responseData;
  
  if (ct.includes('application/json')) {
    responseData = await res.json();
    
    // Log image URLs when retrieving property data
    if (path.includes('/properties/') || path.includes('/staff/') || path.includes('/assignments')) {
      if (responseData.images) {
        console.log('Response includes images:', responseData.images);
      } else if (Array.isArray(responseData)) {
        // For array responses (lists of properties/assignments)
        const hasImages = responseData.some(item => item.images || (item.property && item.property.images));
        if (hasImages) {
          console.log('Response contains items with images');
          
          // Log the first item with images
          const firstWithImages = responseData.find(item => item.images || (item.property && item.property.images));
          if (firstWithImages) {
            console.log('Sample item with images:', 
              firstWithImages.images || (firstWithImages.property && firstWithImages.property.images));
          }
        }
      }
    }
  } else {
    responseData = await res.text();
  }
  
  return responseData;
}

export const AuthAPI = {
  login: (email, password) => {
    console.log('Login attempt:', { email, password: '***' });
    return apiRequest('/api/auth/login', { method: 'POST', body: { email, password } });
  },
  signup: (name, email, password, role, phone, address) => apiRequest('/api/auth/signup', { method: 'POST', body: { name, email, password, role, phone, address } }),
};

export const PropertiesAPI = {
  listApproved: () => apiRequest('/api/properties'),
  listOwnerProperties: (token) => apiRequest('/api/properties/my', { token }),
  create: (formData, token) => apiRequest('/api/properties', { method: 'POST', token, body: formData, isForm: true }),
  get: (id) => apiRequest(`/api/properties/${id}`),
  book: (id, payload, token) => apiRequest(`/api/properties/${id}/book`, { method: 'POST', token, body: payload }),
  submitSupportRequest: (bookingId, payload, token) => apiRequest(`/api/properties/bookings/${bookingId}/support`, { method: 'POST', token, body: payload }),
  completePayment: (bookingId, payload, token) => apiRequest(`/api/properties/bookings/${bookingId}/payment`, { method: 'POST', token, body: payload }),
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
  getAssignments: (staffId, token) => {
    if (!staffId) {
      console.error('StaffAPI.getAssignments called without staffId');
      return Promise.reject(new Error('Staff ID is required'));
    }
    console.log('Fetching assignments for staff ID:', staffId, 'Token available:', !!token);
    
    return apiRequest(`/api/staff/${staffId}/assignments`, { token })
      .then(response => {
        console.log(`Successfully fetched ${response.length} assignments for staff ${staffId}`);
        return response;
      })
      .catch(error => {
        console.error(`Error fetching assignments for staff ${staffId}:`, error);
        throw error;
      });
  },
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
  searchProperties: (query) => apiRequest(`/api/search/properties?${new URLSearchParams(query)}`),
  getNearby: (lat, lng, radius) => apiRequest(`/api/search/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getFilters: () => apiRequest('/api/search/filters'),
  getSuggestions: (query) => apiRequest(`/api/search/suggestions?q=${encodeURIComponent(query)}`),
};

export const StaffReportAPI = {
  submitReport: (assignmentId, reportData, token) => apiRequest(`/api/staff/assignments/${assignmentId}/report`, { 
    method: 'POST', 
    token, 
    body: reportData 
  }),
  getReportsForStaff: (staffId, token) => apiRequest(`/api/staff/${staffId}/reports`, { token }),
  getAllReports: (token) => apiRequest('/api/staff/reports', { token }),
  reviewReport: (reportId, token) => apiRequest(`/api/staff/reports/${reportId}/review`, { method: 'PUT', token }),
  forwardReport: (reportId, token) => apiRequest(`/api/staff/reports/${reportId}/forward`, { method: 'PUT', token })
};

export const ReportsAPI = {
  getOwnerReports: (token) => apiRequest('/api/reports/owner/reports', { token }),
  acknowledgeReport: (reportId, token) => apiRequest(`/api/reports/owner/reports/${reportId}/acknowledge`, { method: 'PUT', token })
};


