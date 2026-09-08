import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, FolderOpen } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { categories as catApi } from '../../api';
import { showToast } from '../../components/utils';
import { coreLinks } from './Dashboard';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = () => {
    catApi.list(true)
      .then(res => setCategories(res.categories || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  const openCreateForm = () => {
    setEditingCat(null);
    setFormData({ name: '', description: '', sort_order: 0 });
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    setEditingCat(cat);
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      sort_order: cat.sort_order || 0,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCat(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Nama kategori wajib diisi', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        sort_order: parseInt(formData.sort_order) || 0,
      };

      if (editingCat) {
        await catApi.update(editingCat.id, payload);
        showToast('Kategori berhasil diupdate', 'success');
      } else {
        await catApi.create(payload);
        showToast('Kategori baru berhasil ditambahkan', 'success');
      }

      closeForm();
      fetchCategories();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    const itemCount = cat.menu_items?.length || 0;
    if (itemCount > 0) {
      showToast(`Tidak bisa menghapus "${cat.name}" karena masih punya ${itemCount} menu item. Pindahkan atau hapus item-nya terlebih dahulu.`, 'error');
      return;
    }
    if (!confirm(`Hapus kategori "${cat.name}"?`)) return;

    try {
      await catApi.delete(cat.id);
      showToast(`Kategori "${cat.name}" berhasil dihapus`, 'success');
      fetchCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <AdminLayout title="Kelola Kategori" links={coreLinks}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <p className="text-text-muted font-semibold text-sm">{categories.length} kategori</p>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-md"
        >
          <Plus size={18} /> Tambah Kategori
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center text-text-muted border border-border">
          <FolderOpen size={64} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold mb-2">Belum Ada Kategori</h3>
          <p>Mulai dengan menambahkan kategori pertama untuk menu kamu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => {
            const itemCount = cat.menu_items?.length || 0;
            return (
              <div key={cat.id} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
                      {cat.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{cat.name}</h3>
                      {cat.description && <p className="text-xs text-text-muted line-clamp-1">{cat.description}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-surface-hover rounded-lg text-xs font-bold text-text-muted border border-border">
                      {itemCount} menu item{itemCount !== 1 ? 's' : ''}
                    </span>
                    {cat.sort_order > 0 && (
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold border border-blue-500/20">
                        Urutan: {cat.sort_order}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditForm(cat)} className="p-2 rounded-lg text-text-muted hover:text-blue-500 hover:bg-blue-500/10 transition" title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(cat)} className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition" title="Hapus">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9000] flex items-center justify-center p-6" onClick={closeForm}>
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h2>
              <button onClick={closeForm} className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-primary transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Nama Kategori *</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                  placeholder="Contoh: Ramen, Minuman, Topping"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Deskripsi</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                  placeholder="Deskripsi opsional..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Urutan Tampil</label>
                <input
                  type="number" min="0"
                  value={formData.sort_order}
                  onChange={e => setFormData({ ...formData, sort_order: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                  placeholder="0"
                />
                <p className="text-xs text-text-muted mt-1">Semakin kecil angka, semakin di atas posisinya.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={closeForm} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border hover:bg-surface-hover transition">Batal</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-orange-600 transition disabled:opacity-50">
                  {saving ? 'Menyimpan...' : (editingCat ? 'Simpan Perubahan' : 'Tambah Kategori')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
