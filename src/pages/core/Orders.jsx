import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, UtensilsCrossed, Settings, Receipt, Package, Search, Eye, ChevronDown } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { orders as ordersApi } from '../../api';
import { showToast, formatPrice, formatDate, getStatusLabel, getOrderTypeLabel, showModal } from '../../components/utils';
import { coreLinks } from './Dashboard';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = () => {
    ordersApi.list()
      .then(res => setOrders(res.orders || []))
      .catch(err => { if (loading) showToast(err.message, 'error'); })
      .finally(() => setLoading(false));
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await ordersApi.updateStatus(id, newStatus);
      showToast(`Status pesanan #${id} diperbarui`, 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm(`Batalkan pesanan #${id}?`)) return;
    try {
      await ordersApi.cancel(id);
      showToast(`Pesanan #${id} dibatalkan`, 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const viewOrderDetails = (order) => {
    const content = `
      <div class="space-y-4">
        <div class="flex justify-between border-b border-border pb-4">
          <div>
            <p class="text-sm text-text-muted">ID Pesanan</p>
            <p class="font-bold">#${order.id}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-text-muted">Waktu</p>
            <p class="font-bold">${formatDate(order.created_at)}</p>
          </div>
        </div>
        <div class="flex gap-4 border-b border-border pb-4">
          <div>
            <p class="text-sm text-text-muted">Tipe</p>
            <p class="font-bold">${getOrderTypeLabel(order.order_type)}</p>
          </div>
          ${order.table_number ? `<div><p class="text-sm text-text-muted">Meja</p><p class="font-bold">${order.table_number}</p></div>` : ''}
          ${order.customer_name ? `<div><p class="text-sm text-text-muted">Pemesan</p><p class="font-bold">${order.customer_name}</p></div>` : ''}
          <div>
            <p class="text-sm text-text-muted">Status</p>
            <p class="font-bold">${getStatusLabel(order.status)}</p>
          </div>
        </div>
        <div>
          <p class="font-bold mb-2">Item:</p>
          <div class="bg-surface border border-border rounded-lg divide-y divide-border">
            ${(order.items || []).map(i => `
              <div class="p-3 flex justify-between items-center">
                <div class="flex gap-3">
                  <span class="font-bold">${i.quantity}x</span>
                  <span>
                    ${i.menu_item?.name || 'Item Terhapus'}
                    ${i.notes ? `<p class="text-xs text-text-muted mt-1 italic">Catatan: ${i.notes}</p>` : ''}
                  </span>
                </div>
                <span class="font-semibold">${formatPrice(i.price * i.quantity)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="flex justify-between items-center text-xl font-bold pt-4 border-t border-border">
          <span>Total</span>
          <span class="text-primary">${formatPrice(order.total_amount)}</span>
        </div>
      </div>
    `;
    showModal({ title: `Detail Pesanan #${order.id}`, content, wide: true });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'ready': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'preparing': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'unpaid': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'active' && ['completed', 'cancelled'].includes(o.status)) return false;
    if (filter === 'completed' && o.status !== 'completed') return false;
    if (filter === 'cancelled' && o.status !== 'cancelled') return false;
    if (search && !o.id.toString().includes(search) && !(o.table_number && o.table_number.includes(search))) return false;
    return true;
  });

  return (
    <AdminLayout title="Semua Pesanan" links={coreLinks}>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex bg-surface border border-border p-1 rounded-lg flex-wrap">
          {[
            { key: 'active', label: 'Aktif' },
            { key: 'completed', label: 'Selesai' },
            { key: 'cancelled', label: 'Dibatalkan' },
            { key: 'all', label: 'Semua' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-sm font-bold rounded-md transition ${filter === f.key ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Cari ID / Meja..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-text-muted" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-black">{orders.length}</p>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Aktif</p>
          <p className="text-2xl font-black">{orders.filter(o => ['unpaid', 'pending', 'preparing', 'ready'].includes(o.status)).length}</p>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Selesai</p>
          <p className="text-2xl font-black">{orders.filter(o => o.status === 'completed').length}</p>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Dibatalkan</p>
          <p className="text-2xl font-black">{orders.filter(o => o.status === 'cancelled').length}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-border">ID</th>
                <th className="p-4 font-bold border-b border-border">Tipe / Meja</th>
                <th className="p-4 font-bold border-b border-border">Item</th>
                <th className="p-4 font-bold border-b border-border">Total</th>
                <th className="p-4 font-bold border-b border-border">Status</th>
                <th className="p-4 font-bold border-b border-border">Waktu</th>
                <th className="p-4 font-bold border-b border-border text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="7" className="p-10 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="7" className="p-16 text-center text-text-muted">
                  <Receipt size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Tidak ada pesanan yang sesuai filter.</p>
                </td></tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-surface-hover/30 transition-colors">
                  <td className="p-4 font-black text-lg">#{order.id}</td>
                  <td className="p-4">
                    <span className="font-semibold">{getOrderTypeLabel(order.order_type)}</span>
                    {order.table_number && <span className="ml-2 px-2 py-0.5 bg-background border border-border rounded text-xs font-bold">Meja {order.table_number}</span>}
                    {order.customer_name && <span className="ml-2 px-2 py-0.5 bg-background border border-border rounded text-xs font-bold">{order.customer_name}</span>}
                  </td>
                  <td className="p-4 text-sm text-text-muted max-w-48">
                    <div className="line-clamp-2">
                      {(order.items || []).map(i => `${i.quantity}x ${i.menu_item?.name || '?'}`).join(', ')}
                    </div>
                  </td>
                  <td className="p-4 font-bold">{formatPrice(order.total_amount)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text-muted whitespace-nowrap">{formatDate(order.created_at)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition"
                        title="Lihat Detail"
                      >
                        <Eye size={18} />
                      </button>

                      {/* Status update buttons */}
                      {order.status === 'unpaid' && (
                        <button onClick={() => updateStatus(order.id, 'pending')} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs transition">Lunas</button>
                      )}
                      {order.status === 'pending' && (
                        <button onClick={() => updateStatus(order.id, 'preparing')} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition">Proses</button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => updateStatus(order.id, 'ready')} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition">Siap</button>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={() => updateStatus(order.id, 'completed')} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition">Selesai</button>
                      )}
                      {['unpaid', 'pending', 'preparing', 'ready'].includes(order.status) && (
                        <button onClick={() => handleCancel(order.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-lg text-xs transition border border-red-500/20">Batal</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
