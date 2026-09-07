// Auth state management
const AUTH_KEY = 'muma_token';
const USER_KEY = 'muma_user';

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(AUTH_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export function login(token, user) {
  localStorage.setItem(AUTH_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.hash = '#/login';
}

export function getRole() {
  const user = getUser();
  return user?.role || null;
}

export function hasRole(...roles) {
  const role = getRole();
  return roles.includes(role);
}

export function canAccess(section) {
  const role = getRole();
  if (!role) return false;

  const permissions = {
    order: ['pembeli', 'kasir', 'admin'],
    pos: ['kasir', 'admin', 'superadmin'],
    core: ['admin', 'superadmin'],
  };

  return permissions[section]?.includes(role) || false;
}

export function getRoleLabel(role) {
  const labels = {
    pembeli: 'Pembeli',
    kasir: 'Kasir',
    admin: 'Admin',
    superadmin: 'Super Admin',
  };
  return labels[role] || role;
}
