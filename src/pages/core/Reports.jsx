import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { orders as ordersApi } from '../../api';
import { showToast, formatPrice, formatDate } from '../../components/utils';
import { coreLinks } from './Dashboard';

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month

  useEffect(() => {
    ordersApi.list()
      .then(res => setOrders(res.orders || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  // Compute stats based on date range
  const filteredOrders = orders.filter(o => o.status === 'completed').filter(o => {
    if (dateRange === 'all') return true;
    
    const orderDate = new Date(o.created_at);
    const today = new Date();
    
    if (dateRange === 'today') {
      return orderDate.toDateString() === today.toDateString();
    }
    
    const diffTime = Math.abs(today - orderDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (dateRange === 'week') return diffDays <= 7;
    if (dateRange === 'month') return diffDays <= 30;
    
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Compute top items
  const itemCounts = {};
  filteredOrders.forEach(o => {
    (o.items || []).forEach(i => {
      const name = i.menu_item?.name || 'Item Terhapus';
      if (!itemCounts[name]) {
        itemCounts[name] = { count: 0, revenue: 0 };
      }
      itemCounts[name].count += i.quantity;
      itemCounts[name].revenue += (i.price * i.quantity);
    });
  });

  const topItems = Object.entries(itemCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <AdminLayout title="Laporan Penjualan (Core)" links={coreLinks}>
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Ringkasan Penjualan</h2>
          <p className="text-sm text-text-muted mt-1">Laporan dari pesanan yang sudah selesai</p>
        </div>
        
        <div className="flex bg-surface border border-border p-1 rounded-xl">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'week', label: '7 Hari' },
            { id: 'month', label: '30 Hari' },
            { id: 'all', label: 'Semua Waktu' },
          ].map(range => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${dateRange === range.id ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text'}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="space-y-8">
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-2xl border border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80} /></div>
              <p className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><TrendingUp size={16} /> Total Pendapatan</p>
              <h3 className="text-4xl font-black text-primary">{formatPrice(totalRevenue)}</h3>
            </div>
            
            <div className="glass p-6 rounded-2xl border border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><ShoppingBag size={80} /></div>
              <p className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><ShoppingBag size={16} /> Pesanan Selesai</p>
              <h3 className="text-4xl font-black">{totalOrders} <span className="text-sm text-text-muted font-normal">pesanan</span></h3>
            </div>

            <div className="glass p-6 rounded-2xl border border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><BarChart3 size={80} /></div>
              <p className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><BarChart3 size={16} /> Rata-Rata Transaksi</p>
              <h3 className="text-4xl font-black text-emerald-500">{formatPrice(avgOrderValue)}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Items */}
            <div className="glass p-6 rounded-2xl border border-border lg:col-span-1">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" /> Menu Terlaris
              </h3>
              
              {topItems.length === 0 ? (
                <p className="text-sm text-text-muted">Belum ada data penjualan.</p>
              ) : (
                <div className="space-y-4">
                  {topItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary font-bold rounded-lg flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.name}</p>
                          <p className="text-xs text-text-muted">{item.count} porsi terjual</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted font-bold">Revenue</p>
                        <p className="font-bold text-sm text-emerald-500">{formatPrice(item.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Completed Orders */}
            <div className="glass p-6 rounded-2xl border border-border lg:col-span-2">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-500" /> Riwayat Transaksi Terbaru
              </h3>
              
              {filteredOrders.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-10">Belum ada transaksi di periode ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface text-text-muted text-xs uppercase tracking-wider">
                        <th className="p-3 font-bold rounded-l-lg">ID</th>
                        <th className="p-3 font-bold">Waktu</th>
                        <th className="p-3 font-bold">Tipe</th>
                        <th className="p-3 font-bold text-right rounded-r-lg">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredOrders.slice(0, 10).map(order => (
                        <tr key={order.id} className="hover:bg-surface-hover/30 transition-colors">
                          <td className="p-3 font-bold">{order.order_number}</td>
                          <td className="p-3 text-sm text-text-muted">{formatDate(order.created_at)}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-surface-hover rounded border border-border text-xs font-bold">
                              {order.order_type === 'dine_in' ? `Dine-In (Meja ${order.table_number})` : 'Take Away'}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-right text-emerald-500">{formatPrice(order.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredOrders.length > 10 && (
                    <p className="text-center text-xs text-text-muted mt-4">
                      Menampilkan 10 transaksi terbaru dari total {filteredOrders.length} transaksi.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
