import { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, UtensilsCrossed, Settings, Users, Package, TrendingUp, TrendingDown, RefreshCcw, BarChart3, Store } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { dashboard as dashboardApi } from '../../api';
import { showToast, formatPrice } from '../../components/utils';

export const coreLinks = [
  { label: 'Overview', path: '/core/dashboard', icon: LayoutDashboard },
  { label: 'Laporan', path: '/core/reports', icon: BarChart3 },
  { label: 'Semua Pesanan', path: '/core/orders', icon: Receipt },
  { label: 'Kelola Menu', path: '/core/menu', icon: UtensilsCrossed },
  { label: 'Kelola Kategori', path: '/core/categories', icon: Settings },
  { label: 'Kelola Stok', path: '/core/stock', icon: Package },
  { label: 'Pengaturan Toko', path: '/core/settings', icon: Store },
  { label: 'Pengguna', path: '/core/users', icon: Users },
];

export default function CoreDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then(res => setStats(res))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Admin Overview" links={coreLinks}>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue */}
            <div className="glass p-6 rounded-2xl border border-border">
              <p className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Total Pendapatan</p>
              <h3 className="text-3xl font-black text-primary">{formatPrice(stats.total_revenue)}</h3>
              <p className="text-xs text-text-muted mt-2">Sepanjang waktu</p>
            </div>
            
            {/* Orders */}
            <div className="glass p-6 rounded-2xl border border-border">
              <p className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Total Pesanan</p>
              <h3 className="text-3xl font-black">{stats.total_orders}</h3>
              <p className="text-xs text-text-muted mt-2">Pesanan berhasil</p>
            </div>

            {/* Menu Items */}
            <div className="glass p-6 rounded-2xl border border-border">
              <p className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Menu Aktif</p>
              <h3 className="text-3xl font-black">{stats.total_menu_items}</h3>
              <p className="text-xs text-text-muted mt-2">Item tersedia</p>
            </div>

            {/* Users */}
            <div className="glass p-6 rounded-2xl border border-border">
              <p className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Total Pengguna</p>
              <h3 className="text-3xl font-black">{stats.total_users}</h3>
              <p className="text-xs text-text-muted mt-2">Termasuk pelanggan</p>
            </div>
          </div>

          <div className="glass rounded-2xl border border-border p-8 text-center text-text-muted mt-8">
            <LayoutDashboard size={64} className="mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold mb-2">Muma Ramen Core Panel</h2>
            <p className="max-w-md mx-auto">Gunakan menu di sebelah kiri untuk mengelola pesanan, mengatur menu hidangan, kategori, manajemen stok, dan akses pengguna.</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-text-muted font-bold">Gagal memuat statistik.</div>
      )}
    </AdminLayout>
  );
}
