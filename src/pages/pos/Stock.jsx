import { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, Package, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { menu as menuApi } from '../../api';
import { showToast, formatPrice, getMenuImage } from '../../components/utils';

export default function POSStock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const links = [
    { label: 'Dashboard Kasir', path: '/pos/dashboard', icon: LayoutDashboard },
    { label: 'Kelola Pesanan', path: '/pos/orders', icon: Receipt },
    { label: 'Cek Stok', path: '/pos/stock', icon: Package },
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = () => {
    menuApi.list(false)
      .then(res => setItems(res.menu || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  const handleStockUpdate = async (id, newStock) => {
    try {
      await menuApi.updateStock(id, newStock);
      showToast('Stok berhasil diupdate', 'success');
      setItems(items.map(item => item.id === id ? { ...item, stock: newStock } : item));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleAvailability = async (id, available) => {
    try {
      await menuApi.toggleAvailability(id, available);
      showToast(available ? 'Menu diaktifkan' : 'Menu dinonaktifkan', 'success');
      setItems(items.map(item => item.id === id ? { ...item, is_available: available } : item));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Cek & Kelola Stok" links={links}>
      <div className="mb-6 relative w-full md:w-96">
        <input 
          type="text" 
          placeholder="Cari Menu..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition"
        />
        <Search className="absolute left-3 top-3 text-text-muted" />
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-border">Menu</th>
                <th className="p-4 font-bold border-b border-border">Harga</th>
                <th className="p-4 font-bold border-b border-border">Stok Saat Ini</th>
                <th className="p-4 font-bold border-b border-border">Status Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-text-muted">Tidak ada menu ditemukan.</td></tr>
              ) : filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-surface-hover/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={getMenuImage(item.image_url, item.name)} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-surface-hover" />
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs text-text-muted">{item.category?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-semibold">{formatPrice(item.price)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="0"
                        defaultValue={item.stock}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val !== item.stock) {
                            handleStockUpdate(item.id, val);
                          }
                        }}
                        className="w-20 px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-center focus:outline-none focus:border-primary"
                      />
                      <span className="text-xs text-text-muted">Porsi</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={item.is_available}
                        onChange={(e) => handleToggleAvailability(item.id, e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ml-3 text-sm font-semibold text-text-muted peer-checked:text-text">
                        {item.is_available ? 'Aktif' : 'Habis/Nonaktif'}
                      </span>
                    </label>
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
