import { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, Package, LogOut, PlusCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { orders as ordersApi } from '../../api';
import { showToast, formatPrice, getStatusLabel } from '../../components/utils';

export const posLinks = [
  { label: 'Dashboard Kasir', path: '/pos/dashboard', icon: LayoutDashboard },
  { label: 'Buat Pesanan', path: '/pos/create', icon: PlusCircle },
  { label: 'Kelola Pesanan', path: '/pos/orders', icon: Receipt },
  { label: 'Cek Stok', path: '/pos/stock', icon: Package },
];

export default function POSDashboard() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = () => {
    ordersApi.list()
      .then(res => {
        // Filter only active orders (pending, preparing, ready)
        const active = (res.orders || []).filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
        setActiveOrders(active);
      })
      .catch(err => {
        if (loading) showToast(err.message, 'error');
      })
      .finally(() => setLoading(false));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ready': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'preparing': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <AdminLayout title="Dashboard Kasir" links={posLinks}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Ringkasan Operasional</h2>
        <a href="#/pos/create" className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition shadow-md">
          <PlusCircle size={20} /> Pesanan Baru
        </a>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm font-bold uppercase tracking-wider mb-1">Pesanan Aktif</p>
            <h3 className="text-4xl font-black">{activeOrders.length}</h3>
          </div>
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Receipt size={28} />
          </div>
        </div>
        
        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm font-bold uppercase tracking-wider mb-1">Menunggu</p>
            <h3 className="text-4xl font-black">{activeOrders.filter(o => o.status === 'pending').length}</h3>
          </div>
          <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
            <Receipt size={28} />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm font-bold uppercase tracking-wider mb-1">Siap Disajikan</p>
            <h3 className="text-4xl font-black">{activeOrders.filter(o => o.status === 'ready').length}</h3>
          </div>
          <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
            <Package size={28} />
          </div>
        </div>
      </div>

      {/* Active Orders List */}
      <div className="glass rounded-2xl overflow-hidden border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
          <h2 className="font-bold text-lg">Pesanan Perlu Diproses</h2>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : activeOrders.length === 0 ? (
            <div className="p-16 text-center text-text-muted">
              <Receipt size={48} className="mx-auto mb-4 opacity-20" />
              <p>Tidak ada pesanan aktif saat ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-border">ID Order</th>
                    <th className="p-4 font-bold border-b border-border">Tipe / Meja</th>
                    <th className="p-4 font-bold border-b border-border">Total</th>
                    <th className="p-4 font-bold border-b border-border">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeOrders.map(order => (
                    <tr key={order.id} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="p-4 font-semibold">{order.order_number}</td>
                      <td className="p-4">
                        <span className="font-semibold">{order.order_type === 'dine_in' ? 'Dine In' : 'Take Away'}</span>
                        {order.table_number && <span className="ml-2 px-2 py-0.5 bg-background border border-border rounded text-xs font-bold">Meja {order.table_number}</span>}
                      </td>
                      <td className="p-4 font-bold">{formatPrice(order.total_amount)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
