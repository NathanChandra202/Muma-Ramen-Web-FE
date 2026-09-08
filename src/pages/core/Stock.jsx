import { useState, useEffect } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { menu as menuApi } from '../../api';
import { showToast, formatPrice, getMenuImage } from '../../components/utils';
import { coreLinks } from './Dashboard';

export default function Stock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = () => {
    menuApi.list()
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
  const lowStockCount = items.filter(i => i.stock <= 5 && i.stock > 0).length;
  const outOfStockCount = items.filter(i => i.stock === 0).length;

  return (
    <AdminLayout title="Kelola Stok" links={coreLinks}>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <span className="font-bold text-lg">{items.length}</span>
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Menu</p>
            <p className="font-bold">{items.length} item</p>
          </div>
        </div>
        <div className="glass p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Stok Rendah</p>
            <p className="font-bold text-amber-500">{lowStockCount} item</p>
          </div>
        </div>
        <div className="glass p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
            <span className="font-bold text-lg">0</span>
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Habis</p>
            <p className="font-bold text-red-500">{outOfStockCount} item</p>
          </div>
        </div>
      </div>

      {/* Search */}
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

      {/* Table */}
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
                <tr key={item.id} className={`hover:bg-surface-hover/30 transition-colors ${item.stock === 0 ? 'opacity-60' : ''}`}>
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
                        className={`w-20 px-3 py-1.5 bg-background border rounded-lg text-sm text-center focus:outline-none focus:border-primary ${item.stock <= 5 ? 'border-red-500/50 text-red-500' : 'border-border'}`}
                      />
                      <span className="text-xs text-text-muted">Porsi</span>
                      {item.stock <= 5 && item.stock > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs font-bold rounded border border-amber-500/20">Rendah</span>
                      )}
                      {item.stock === 0 && (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs font-bold rounded border border-red-500/20">Habis</span>
                      )}
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
