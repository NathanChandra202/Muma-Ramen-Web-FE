// API Client for Muma Ramen Backend
const API_BASE = 'http://localhost:9003/api';

function getToken() {
  return localStorage.getItem('muma_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

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

// Auth
export const auth = {
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  register: (name, email, password) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
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
};

// Categories
export const categories = {
  list: (includeItems = false) => request(`/categories${includeItems ? '?include_items=true' : ''}`),
  create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
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
};

// Dashboard
export const dashboard = {
  stats: () => request('/dashboard/stats'),
};
