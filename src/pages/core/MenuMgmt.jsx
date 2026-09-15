import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, X, Upload } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { menu as menuApi, categories as catApi } from '../../api';
import { showToast, formatPrice, getMenuImage, getImageUrl } from '../../components/utils';
import { coreLinks } from './Dashboard';

const emptyForm = { name: '', description: '', price: '', category_id: '', stock: '', is_available: true, imageFiles: null };

export default function MenuMgmt() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = () => {
    Promise.all([menuApi.list(), catApi.list()])
      .then(([m, c]) => {
        setItems(m.menu || []);
        setCategories(c.categories || []);
      })
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  const openCreateForm = () => {
    setEditingItem(null);
    setFormData({ ...emptyForm });
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category_id: item.category_id?.toString() || '',
      stock: item.stock?.toString() || '0',
      is_available: item.is_available,
      imageFiles: null,
    });
    
    // Parse existing images
    let parsedImages = [];
    if (item.images && item.images !== 'null' && item.images !== '[]') {
      try { parsedImages = JSON.parse(item.images); } catch (e) {}
    } else if (item.image_url) {
      parsedImages = [item.image_url];
    }
    setExistingImages(parsedImages);
    setPreviewImages([]);
    
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ ...emptyForm });
    previewImages.forEach(url => URL.revokeObjectURL(url));
    setPreviewImages([]);
    setExistingImages([]);
  };

  const handleDeleteExistingImage = async (pathToRemove) => {
    if (!window.confirm('Yakin ingin menghapus foto ini?')) return;
    
    const newImages = existingImages.filter(p => p !== pathToRemove);
    const newImageUrl = newImages.length > 0 ? newImages[0] : "";
    
    try {
      await menuApi.update(editingItem.id, { image_url: newImageUrl, images: JSON.stringify(newImages) });
      setExistingImages(newImages);
      setEditingItem({ ...editingItem, image_url: newImageUrl, images: JSON.stringify(newImages) });
      setItems(items.map(item => item.id === editingItem.id ? { ...item, image_url: newImageUrl, images: JSON.stringify(newImages) } : item));
      showToast('Foto berhasil dihapus', 'success');
    } catch (err) {
      showToast('Gagal menghapus foto', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category_id) {
      showToast('Lengkapi semua field wajib', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        stock: parseInt(formData.stock) || 0,
        is_available: formData.is_available,
      };

      let savedItemId = null;
      if (editingItem) {
        await menuApi.update(editingItem.id, payload);
        savedItemId = editingItem.id;
        showToast('Menu berhasil diupdate', 'success');
      } else {
        const res = await menuApi.create(payload);
        savedItemId = res.menu_item.id;
        showToast('Menu baru berhasil ditambahkan', 'success');
      }

      // Upload image if selected
      if (savedItemId && formData.imageFiles && formData.imageFiles.length > 0) {
        const formPayload = new FormData();
        for (let i = 0; i < formData.imageFiles.length; i++) {
          formPayload.append('images', formData.imageFiles[i]);
        }
        await menuApi.uploadImage(savedItemId, formPayload);
      }

      closeForm();
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Hapus menu "${item.name}"? Aksi ini tidak bisa dibatalkan.`)) return;
    try {
      await menuApi.delete(item.id);
      showToast(`"${item.name}" berhasil dihapus`, 'success');
      fetchData();
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

  const handleImageUpload = async (itemId, files) => {
    if (!files || files.length === 0) return;
    const formPayload = new FormData();
    for (let i = 0; i < files.length; i++) {
      formPayload.append('images', files[i]);
    }
    try {
      await menuApi.uploadImage(itemId, formPayload);
      showToast('Gambar berhasil diupload', 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredItems = items.filter(item => {
    const matchCat = filterCat === 'all' || item.category_id == filterCat;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <AdminLayout title="Kelola Menu" links={coreLinks}>
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-md"
          >
            <Plus size={18} /> Tambah Menu
          </button>

          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold focus:outline-none focus:border-primary transition"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Cari menu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition"
          />
          <Search size={16} className="absolute left-3 top-3 text-text-muted" />
        </div>
      </div>

      {/* Info */}
      <p className="text-sm text-text-muted mb-4 font-semibold">{filteredItems.length} menu ditemukan</p>

      {/* Table */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-border">Menu</th>
                <th className="p-4 font-bold border-b border-border">Kategori</th>
                <th className="p-4 font-bold border-b border-border">Harga</th>
                <th className="p-4 font-bold border-b border-border">Stok</th>
                <th className="p-4 font-bold border-b border-border">Status</th>
                <th className="p-4 font-bold border-b border-border text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="6" className="p-10 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="6" className="p-16 text-center text-text-muted">Tidak ada menu ditemukan.</td></tr>
              ) : filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-surface-hover/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative group w-12 h-12 shrink-0">
                        <img src={getMenuImage(item.image_url, item.name)} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-surface-hover" />
                      </div>
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs text-text-muted line-clamp-1 max-w-48">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <span className="px-2 py-1 bg-surface-hover rounded-lg text-xs font-bold">{item.category?.name || '-'}</span>
                  </td>
                  <td className="p-4 font-bold">{formatPrice(item.price)}</td>
                  <td className="p-4">
                    <span className={`font-bold ${item.stock <= 5 ? 'text-red-500' : ''}`}>{item.stock}</span>
                    <span className="text-xs text-text-muted ml-1">porsi</span>
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
                      <span className="ml-2 text-xs font-semibold text-text-muted peer-checked:text-text">
                        {item.is_available ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </label>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEditForm(item)} className="p-2 rounded-lg text-text-muted hover:text-blue-500 hover:bg-blue-500/10 transition" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition" title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9000] flex items-center justify-center p-6" onClick={closeForm}>
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Menu' : 'Tambah Menu Baru'}</h2>
              <button onClick={closeForm} className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-primary transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Nama Menu *</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                  placeholder="Contoh: Tonkotsu Ramen"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition resize-none"
                  rows="3"
                  placeholder="Deskripsi singkat tentang menu ini..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Harga (Rp) *</label>
                  <input
                    type="number" required min="0"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Stok (Porsi)</label>
                  <input
                    type="number" min="0"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Kategori *</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_available}
                    onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
                <span className="text-sm font-semibold">Tersedia / Aktif</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Foto Menu (Akan ditambahkan ke foto yang sudah ada)</label>
                <div className="relative group rounded-xl overflow-hidden bg-surface-hover border border-border/50 hover:border-primary/50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => {
                      const files = e.target.files;
                      setFormData({ ...formData, imageFiles: files });
                      
                      // Create previews for new files
                      previewImages.forEach(url => URL.revokeObjectURL(url)); // Clean up old
                      if (files && files.length > 0) {
                        const newPreviews = Array.from(files).map(f => URL.createObjectURL(f));
                        setPreviewImages(newPreviews);
                      } else {
                        setPreviewImages([]);
                      }
                    }}
                    className="w-full text-sm text-text-muted file:mr-4 file:py-3 file:px-4 file:rounded-l-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                </div>
                
                {/* Image Previews */}
                {(existingImages.length > 0 || previewImages.length > 0) && (
                  <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {/* Existing Images */}
                    {existingImages.map((path, i) => (
                      <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-border/50 group/img">
                        <img src={getImageUrl(path)} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(path)}
                          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover/img:opacity-100 hover:bg-red-500 transition-all scale-75 group-hover/img:scale-100 shadow-sm"
                          title="Hapus foto ini"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    
                    {/* New Preview Images */}
                    {previewImages.map((url, i) => (
                      <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/50 group/img">
                        <img src={url} alt="New Preview" className="w-full h-full object-cover opacity-80" />
                        <span className="absolute bottom-1 right-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">Baru</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={closeForm} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border hover:bg-surface-hover transition">Batal</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-orange-600 transition disabled:opacity-50">
                  {saving ? 'Menyimpan...' : (editingItem ? 'Simpan Perubahan' : 'Tambah Menu')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
