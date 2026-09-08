import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getUser } from '../auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, ChevronRight, LayoutDashboard, Receipt, Package, PlusCircle, UtensilsCrossed, Settings, Users, BarChart3 } from 'lucide-react';

export default function AdminLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinks = (role) => {
    if (role === 'kasir') {
      return [
        { label: 'Dashboard Kasir', path: '/pos/dashboard', icon: LayoutDashboard },
        { label: 'Buat Pesanan', path: '/pos/create', icon: PlusCircle },
        { label: 'Kelola Pesanan', path: '/pos/orders', icon: Receipt },
        { label: 'Kelola Stok', path: '/pos/stock', icon: Package },
      ];
    }
    if (role === 'admin') {
      return [
        { label: 'Overview', path: '/core/dashboard', icon: LayoutDashboard },
        { label: 'Buat Pesanan', path: '/pos/create', icon: PlusCircle },
        { label: 'Laporan Penjualan', path: '/core/reports', icon: BarChart3 },
        { label: 'Semua Pesanan', path: '/core/orders', icon: Receipt },
        { label: 'Kelola Menu', path: '/core/menu', icon: UtensilsCrossed },
        { label: 'Kelola Kategori', path: '/core/categories', icon: Settings },
        { label: 'Kelola Stok', path: '/core/stock', icon: Package },
        { label: 'Kelola Kasir & User', path: '/core/users', icon: Users },
      ];
    }
    if (role === 'superadmin') {
      return [
        { label: 'Overview', path: '/core/dashboard', icon: LayoutDashboard },
        { label: 'Laporan Penjualan', path: '/core/reports', icon: BarChart3 },
        { label: 'Semua Pesanan', path: '/core/orders', icon: Receipt },
        { label: 'Kelola Menu', path: '/core/menu', icon: UtensilsCrossed },
        { label: 'Kelola Kategori', path: '/core/categories', icon: Settings },
        { label: 'Kelola Stok', path: '/core/stock', icon: Package },
        { label: 'Kelola Pengguna', path: '/core/users', icon: Users },
      ];
    }
    return [];
  };

  const navLinks = getLinks(user?.role);

  return (
    <div className="min-h-screen bg-background text-text flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-text/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-surface border-r border-border z-50 flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Muma Ramen" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
            <h1 className="text-xl font-bold text-primary">Muma Ramen</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-text-muted hover:text-text">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Masuk Sebagai</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-bold text-sm line-clamp-1">{user?.name}</p>
              <p className="text-xs text-text-muted capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            
            return (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-semibold text-sm ${
                  isActive 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-text-muted hover:bg-surface-hover hover:text-text'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isActive ? 'text-white' : 'opacity-70'} />
                  {link.label}
                </div>
                {isActive && <ChevronRight size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-500/10 font-bold transition-colors"
          >
            <LogOut size={20} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border h-16 flex items-center px-4 lg:px-8 justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-text-muted hover:bg-surface-hover rounded-lg transition"
            >
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-xl">{title}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
