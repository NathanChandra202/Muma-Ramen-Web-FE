import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getRole } from './auth';

// Pages
import LandingPage from './pages/Landing';
import MenuPage from './pages/order/Menu';
import CartPage from './pages/order/Cart';
import TrackingPage from './pages/order/Tracking';
import HistoryPage from './pages/order/History';
import ProfilePage from './pages/order/Profile';
import POSDashboard from './pages/pos/Dashboard';
import POSOrders from './pages/pos/Orders';
import POSStock from './pages/pos/Stock';
import CoreDashboard from './pages/core/Dashboard';
import CoreMenu from './pages/core/MenuMgmt';
import CoreCategories from './pages/core/Categories';
import CoreOrders from './pages/core/Orders';
import CoreStock from './pages/core/Stock';
import CoreUsers from './pages/core/Users';
import CoreReports from './pages/core/Reports';
import CoreSettings from './pages/core/SettingsMgmt';
import POSCreate from './pages/pos/POSCreate';

// Auth Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  
  const userRole = getRole();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text gap-4">
        <div className="text-6xl">🚫</div>
        <h1 className="text-2xl font-bold">Akses Ditolak</h1>
        <p className="text-text-muted">Kamu tidak punya akses ke halaman ini</p>
        <a href="#/login" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition">Kembali</a>
      </div>
    );
  }
  
  return children;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Navigate to="/order/menu" replace />} />
        <Route path="/login" element={<LandingPage />} />

        {/* Order Pages - Publik, tidak perlu login */}
        <Route path="/order/menu" element={<MenuPage />} />
        <Route path="/order/cart" element={<CartPage />} />
        <Route path="/order/tracking/:id" element={<TrackingPage />} />
        <Route path="/order/history" element={<HistoryPage />} />
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['pembeli', 'kasir', 'admin', 'superadmin']}>
            <ProfilePage />
          </ProtectedRoute>
        } />

        {/* POS Pages */}
        <Route path="/pos/dashboard" element={
          <ProtectedRoute allowedRoles={['kasir', 'admin', 'superadmin']}>
            <POSDashboard />
          </ProtectedRoute>
        } />
        <Route path="/pos/orders" element={
          <ProtectedRoute allowedRoles={['kasir', 'admin', 'superadmin']}>
            <POSOrders />
          </ProtectedRoute>
        } />
        <Route path="/pos/create" element={
          <ProtectedRoute allowedRoles={['kasir', 'admin']}>
            <POSCreate />
          </ProtectedRoute>
        } />
        <Route path="/pos/stock" element={
          <ProtectedRoute allowedRoles={['kasir', 'admin', 'superadmin']}>
            <POSStock />
          </ProtectedRoute>
        } />

        {/* Core Pages */}
        <Route path="/core/dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <CoreDashboard />
          </ProtectedRoute>
        } />
        <Route path="/core/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <CoreReports />
          </ProtectedRoute>
        } />
        <Route path="/core/menu" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <CoreMenu />
          </ProtectedRoute>
        } />
        <Route path="/core/categories" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <CoreCategories />
          </ProtectedRoute>
        } />
        <Route path="/core/orders" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <CoreOrders />
          </ProtectedRoute>
        } />
        <Route path="/core/stock" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <CoreStock />
          </ProtectedRoute>
        } />
        <Route path="/core/users" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <CoreUsers />
          </ProtectedRoute>
        } />
        <Route path="/core/settings" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <CoreSettings />
          </ProtectedRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
