import { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, Package, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { orders as ordersApi } from '../../api';
import { showToast, formatPrice, formatDate, getStatusLabel, getOrderTypeLabel, showModal } from '../../components/utils';

export default function POSOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, completed, all
  const [search, setSearch] = useState('');

  const links = [
    { label: 'Dashboard Kasir', path: '/pos/dashboard', icon: LayoutDashboard },
    { label: 'Kelola Pesanan', path: '/pos/orders', icon: Receipt },
    { label: 'Cek Stok', path: '/pos/stock', icon: Package },
  ];

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = () => {
    ordersApi.list()
      .then(res => setOrders(res.orders || []))
      .catch(err => { if (loading) showToast(err.message, 'error') })
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
        <div>
          <p class="font-bold mb-2">Item:</p>
          <div class="bg-surface border border-border rounded-lg divide-y divide-border">
            ${order.items.map(i => `
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

  const filteredOrders = orders.filter(o => {
    if (filter === 'active' && ['completed', 'cancelled'].includes(o.status)) return false;
    if (filter === 'completed' && o.status !== 'completed') return false;
    if (search && !o.id.toString().includes(search) && !(o.table_number && o.table_number.includes(search))) return false;
    return true;
  });

  return (
    <AdminLayout title="Kelola Pesanan" links={links}>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex bg-surface border border-border p-1 rounded-lg">
          <button onClick={() => setFilter('active')} className={`px-4 py-2 text-sm font-bold rounded-md transition ${filter === 'active' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}>Aktif</button>
          <button onClick={() => setFilter('completed')} className={`px-4 py-2 text-sm font-bold rounded-md transition ${filter === 'completed' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}>Selesai</button>
          <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-bold rounded-md transition ${filter === 'all' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}>Semua</button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map(order => (
          <div key={order.id} className="glass rounded-2xl p-6 border border-border flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-lg">#{order.id}</h3>
                <p className="text-sm font-semibold">{getOrderTypeLabel(order.order_type)} {order.table_number && `- Meja ${order.table_number}`} {order.customer_name && `- ${order.customer_name}`}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold border ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : order.status === 'cancelled' ? 'bg-red-500/10 text-red-600 border-red-500/20' : order.status === 'unpaid' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            
            <p className="text-xs text-text-muted mb-4">{formatDate(order.created_at)}</p>
            
            <div className="mb-4 text-sm space-y-1 line-clamp-3 h-16">
              {order.items.map(i => (
                <div key={i.id} className="flex gap-2">
                  <span className="font-bold">{i.quantity}x</span>
                  <span className="text-text-muted">{i.menu_item?.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
              <span className="font-bold text-lg">{formatPrice(order.total_amount)}</span>
              <button onClick={() => viewOrderDetails(order)} className="text-sm font-bold text-primary hover:underline">Detail</button>
            </div>

            {/* Actions for Active Orders */}
            {['unpaid', 'pending', 'preparing', 'ready'].includes(order.status) && (
              <div className="mt-4 flex gap-2">
                {order.status === 'unpaid' && <button onClick={() => updateStatus(order.id, 'pending')} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition">Lunas</button>}
                {order.status === 'pending' && <button onClick={() => updateStatus(order.id, 'preparing')} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition">Proses</button>}
                {order.status === 'preparing' && <button onClick={() => updateStatus(order.id, 'ready')} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition">Siap</button>}
                {order.status === 'ready' && <button onClick={() => updateStatus(order.id, 'completed')} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm transition">Selesai</button>}
                
                <button onClick={() => handleCancel(order.id)} className="px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-lg text-sm transition border border-red-500/20">Batal</button>
              </div>
            )}
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div className="col-span-full py-20 text-center text-text-muted">
            <p>Tidak ada pesanan yang sesuai filter.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
