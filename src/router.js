// Simple hash-based SPA router
const routes = {};
let currentCleanup = null;

export function route(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = '#' + path;
}

export function getCurrentPath() {
  return window.location.hash.slice(1) || '/login';
}

export function getParams() {
  const hash = window.location.hash.slice(1);
  const parts = hash.split('/').filter(Boolean);
  return parts;
}

async function handleRoute() {
  const path = getCurrentPath();
  const app = document.getElementById('app');

  // Clean up previous page
  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  // Find matching route
  let handler = routes[path];

  // Try pattern matching (e.g. /order/tracking/:id)
  if (!handler) {
    for (const [pattern, h] of Object.entries(routes)) {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
      if (regex.test(path)) {
        handler = h;
        break;
      }
    }
  }

  if (handler) {
    app.innerHTML = '';
    const cleanup = await handler(app);
    if (typeof cleanup === 'function') {
      currentCleanup = cleanup;
    }
    // Page enter animation
    app.firstElementChild?.classList.add('page-enter');
  } else {
    // 404
    app.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:1rem;">
        <div style="font-size:4rem;">🍜</div>
        <h1 style="font-size:2rem;font-weight:700;">404</h1>
        <p style="color:var(--body-grey);">Halaman tidak ditemukan</p>
        <a href="#/login" class="btn btn-primary">Kembali</a>
      </div>
    `;
  }
}

export function startRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
