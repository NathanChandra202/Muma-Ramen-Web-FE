import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Search, UserPlus, Shield } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { users as usersApi } from '../../api';
import { showToast, formatDate } from '../../components/utils';
import { getUser } from '../../auth';
import { coreLinks } from './Dashboard';

const roleBadge = {
  pembeli: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  kasir: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  admin: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  superadmin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const roleLabel = {
  pembeli: 'Pembeli',
  kasir: 'Kasir',
  admin: 'Admin',
  superadmin: 'Super Admin',
};

const emptyForm = { name: '', email: '', password: '', role: 'pembeli' };

export default function Users() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const currentUser = getUser();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () => {
    usersApi.list()
      .then(res => setUsersList(res.users || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  const openCreateForm = () => {
    setEditingUser(null);
    setFormData({ ...emptyForm });
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'pembeli',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('Lengkapi semua field wajib', 'warning');
      return;
    }
    if (!editingUser && !formData.password) {
      showToast('Password wajib diisi untuk user baru', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const payload = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        await usersApi.update(editingUser.id, payload);
        showToast('User berhasil diupdate', 'success');
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        };
        await usersApi.create(payload);
        showToast('User baru berhasil ditambahkan', 'success');
      }

      closeForm();
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (user.role === 'superadmin') {
      showToast('Tidak bisa menghapus Super Admin', 'error');
      return;
    }
    if (!isSuperAdmin) {
      showToast('Hanya Super Admin yang bisa menghapus user', 'error');
      return;
    }
    if (!confirm(`Hapus user "${user.name}" (${user.email})? Aksi ini tidak bisa dibatalkan.`)) return;

    try {
      await usersApi.delete(user.id);
      showToast(`User "${user.name}" berhasil dihapus`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredUsers = usersList.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  // Role counts
  const roleCounts = usersList.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <AdminLayout title="Pengguna" links={coreLinks}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="glass p-4 rounded-xl text-center cursor-pointer hover:border-primary/50 transition" onClick={() => setFilterRole('all')}>
          <p className="text-2xl font-black">{usersList.length}</p>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total</p>
        </div>
        {Object.entries(roleLabel).map(([key, label]) => (
          <div key={key} className={`glass p-4 rounded-xl text-center cursor-pointer hover:border-primary/50 transition ${filterRole === key ? 'border-primary' : ''}`} onClick={() => setFilterRole(filterRole === key ? 'all' : key)}>
            <p className="text-2xl font-black">{roleCounts[key] || 0}</p>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-md"
        >
          <UserPlus size={18} /> Tambah User
        </button>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Cari nama / email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition"
          />
          <Search size={16} className="absolute left-3 top-3 text-text-muted" />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-border">User</th>
                <th className="p-4 font-bold border-b border-border">Email</th>
                <th className="p-4 font-bold border-b border-border">Role</th>
                <th className="p-4 font-bold border-b border-border">Bergabung</th>
                <th className="p-4 font-bold border-b border-border text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-16 text-center text-text-muted">
                  <Shield size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Tidak ada user ditemukan.</p>
                </td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-surface-hover/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-xs text-text-muted">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-text-muted">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleBadge[user.role] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                      {roleLabel[user.role] || user.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text-muted whitespace-nowrap">{formatDate(user.created_at)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      {user.role !== 'superadmin' && (
                        <>
                          <button onClick={() => openEditForm(user)} className="p-2 rounded-lg text-text-muted hover:text-blue-500 hover:bg-blue-500/10 transition" title="Edit">
                            <Pencil size={16} />
                          </button>
                          {isSuperAdmin && (
                            <button onClick={() => handleDelete(user)} className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition" title="Hapus">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                      {user.role === 'superadmin' && (
                        <span className="text-xs text-text-muted italic">Protected</span>
                      )}
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
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingUser ? 'Edit User' : 'Tambah User Baru'}</h2>
              <button onClick={closeForm} className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-primary transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Nama Lengkap *</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                  placeholder="Nama lengkap"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Email *</label>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                  placeholder="user@contoh.com"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Password *</label>
                  <input
                    type="password" required={!editingUser}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                    placeholder="Min 6 karakter"
                    minLength={6}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Role *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['pembeli', 'kasir', 'admin'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role })}
                      className={`py-2.5 rounded-lg text-sm font-bold transition border ${
                        formData.role === role
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background border-border text-text-muted hover:text-text hover:border-primary/50'
                      }`}
                    >
                      {roleLabel[role]}
                    </button>
                  ))}
                </div>
                {!isSuperAdmin && (
                  <p className="text-xs text-text-muted mt-2">* Hanya Super Admin yang bisa membuat akun Admin.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={closeForm} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border hover:bg-surface-hover transition">Batal</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-orange-600 transition disabled:opacity-50">
                  {saving ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Tambah User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
