// API Client for Muma Ramen Backend
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://api-order-mumaramen.duaenam.id/api';

function getToken() {
  return localStorage.getItem('muma_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else if (!options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    let data = {};
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      await res.text(); // consume the body
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}. Please ensure backend is updated.`);
      }
    }

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Server tidak bisa dihubungi. Pastikan backend sudah jalan.');
    }
    throw err;
  }
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

// Auth
export const auth = {
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  register: (name, email, phone, password) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password }),
  }),
  me: () => request('/auth/me'),
};

// Menu
export const menu = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/menu${query ? '?' + query : ''}`);
  },
  get: (id) => request(`/menu/${id}`),
  create: (data) => request('/menu', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/menu/${id}`, { method: 'DELETE' }),
  updateStock: (id, stock) => request(`/menu/${id}/stock`, { method: 'PUT', body: JSON.stringify({ stock }) }),
  toggleAvailability: (id, isAvailable) => request(`/menu/${id}/availability`, { method: 'PUT', body: JSON.stringify({ is_available: isAvailable }) }),
  uploadImage: (id, formData) => request(`/menu/${id}/image`, { method: 'POST', body: formData }),
};

// Categories
export const categories = {
  list: (includeItems = false) => request(`/categories${includeItems ? '?include_items=true' : ''}`),
  create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  uploadImage: (id, formData) => request(`/categories/${id}/image`, { method: 'POST', body: formData }),
};

// Orders
export const orders = {
  create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders${query ? '?' + query : ''}`);
  },
  get: (id) => request(`/orders/${id}`),
  updateStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  cancel: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
};

// Users
export const users = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users${query ? '?' + query : ''}`);
  },
  create: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  updateProfile: (data) => request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// Dashboard
export const dashboard = {
  stats: () => request('/dashboard/stats'),
};

// Settings
export const settings = {
  get: () => request('/settings'),
  update: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};
