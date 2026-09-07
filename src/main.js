// Muma Ramen — Main Application Entry Point
import './styles/global.css';
import './styles/auth.css';
import './styles/order.css';
import './styles/pos.css';
import './styles/core.css';

import { route, startRouter, navigate } from './router.js';
import { isLoggedIn, hasRole, canAccess } from './auth.js';

// Import pages
import LoginPage from './pages/landing.js';
import MenuPage from './pages/order/menu.js';
import CartPage from './pages/order/cart.js';
import TrackingPage from './pages/order/tracking.js';
import HistoryPage from './pages/order/history.js';
import POSDashboard from './pages/pos/dashboard.js';
import POSOrders from './pages/pos/orders.js';
import POSStock from './pages/pos/stock.js';
import CoreDashboard from './pages/core/dashboard.js';
import CoreMenu from './pages/core/menu-mgmt.js';
import CoreCategories from './pages/core/categories.js';
import CoreOrders from './pages/core/orders.js';
import CoreStock from './pages/core/stock.js';
import CoreUsers from './pages/core/users.js';

// Auth guard helper
function guard(requiredRoles, handler) {
  return (container) => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    if (requiredRoles && !hasRole(...requiredRoles)) {
      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:1rem;">
          <div style="font-size:4rem;">🚫</div>
          <h1 style="font-size:1.5rem;font-weight:700;">Akses Ditolak</h1>
          <p style="color:var(--body-grey);">Kamu tidak punya akses ke halaman ini</p>
          <a href="#/login" class="btn btn-primary">Kembali</a>
        </div>
      `;
      return;
    }
    return handler(container);
  };
}

// Register routes
// Auth
route('/login', LoginPage);
route('/', LoginPage);

// Muma Order (Pembeli / Kasir / Admin)
route('/order/menu', guard(['pembeli', 'kasir', 'admin'], MenuPage));
route('/order/cart', guard(['pembeli', 'kasir', 'admin'], CartPage));
route('/order/tracking/:id', guard(['pembeli', 'kasir', 'admin'], TrackingPage));
route('/order/history', guard(['pembeli', 'kasir', 'admin'], HistoryPage));

// Muma POS (Kasir / Admin / Super Admin)
route('/pos/dashboard', guard(['kasir', 'admin', 'superadmin'], POSDashboard));
route('/pos/orders', guard(['kasir', 'admin', 'superadmin'], POSOrders));
route('/pos/stock', guard(['kasir', 'admin', 'superadmin'], POSStock));

// Muma Core (Admin / Super Admin)
route('/core/dashboard', guard(['admin', 'superadmin'], CoreDashboard));
route('/core/menu', guard(['admin', 'superadmin'], CoreMenu));
route('/core/categories', guard(['admin', 'superadmin'], CoreCategories));
route('/core/orders', guard(['admin', 'superadmin'], CoreOrders));
route('/core/stock', guard(['admin', 'superadmin'], CoreStock));
route('/core/users', guard(['admin', 'superadmin'], CoreUsers));

// Start router
startRouter();
