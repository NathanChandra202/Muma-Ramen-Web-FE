// Muma Core — User Management
import { users as usersApi } from '../../api.js';
import { getUser, logout, getRoleLabel } from '../../auth.js';
import { showToast, formatDate, showModal, confirm } from '../../components/utils.js';

export default async function CoreUsers(container) {
  let userList = [];
  const user = getUser();

  async function loadData() {
    try {
      const data = await usersApi.list();
      userList = data.users || [];
      renderPage();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function renderPage() {
    container.innerHTML = `
      <div class="core-layout">
        <aside class="core-sidebar">
          <div class="core-sidebar-header"><span class="pos-logo">🍜</span><div><h2 class="pos-brand">Muma Core</h2><p class="pos-user">${user?.name}</p><span class="badge badge-role-${user?.role}">${getRoleLabel(user?.role)}</span></div></div>
          <nav class="pos-nav">
            <a class="pos-nav-item" href="#/core/dashboard"><i class="fa-solid fa-chart-line"></i> Dashboard</a>
            <a class="pos-nav-item" href="#/core/orders"><i class="fa-solid fa-receipt"></i> Pesanan</a>
            <a class="pos-nav-item" href="#/core/menu"><i class="fa-solid fa-bowl-food"></i> Menu</a>
            <a class="pos-nav-item" href="#/core/categories"><i class="fa-solid fa-tags"></i> Kategori</a>
            <a class="pos-nav-item" href="#/core/stock"><i class="fa-solid fa-boxes-stacked"></i> Stok</a>
            <a class="pos-nav-item active" href="#/core/users"><i class="fa-solid fa-users-gear"></i> Users</a>
          </nav>
          <div class="pos-sidebar-footer"><button class="btn btn-ghost btn-sm" id="btn-logout" style="width:100%;"><i class="fa-solid fa-right-from-bracket"></i> Logout</button></div>
        </aside>

        <main class="core-main">
          <div class="core-header">
            <h1 style="font-size:var(--font-2xl);font-weight:700;">Kelola Users</h1>
            <button class="btn btn-primary" id="btn-add-user"><i class="fa-solid fa-user-plus"></i> Tambah User</button>
          </div>

          <div class="user-stats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-lg);margin-bottom:var(--space-xl);">
            ${['superadmin', 'admin', 'kasir', 'pembeli'].map(role => `
              <div class="card" style="text-align:center;">
                <div style="font-size:var(--font-xl);font-weight:700;">${userList.filter(u => u.role === role).length}</div>
                <span class="badge badge-role-${role}" style="margin-top:4px;">${getRoleLabel(role)}</span>
              </div>
            `).join('')}
          </div>

          <div class="card" style="overflow-x:auto;">
            <table class="data-table">
              <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Tanggal Daftar</th><th>Aksi</th></tr></thead>
              <tbody>
                ${userList.map(u => `
                  <tr>
                    <td><strong>${u.name}</strong></td>
                    <td style="color:var(--body-grey);">${u.email}</td>
                    <td><span class="badge badge-role-${u.role}">${getRoleLabel(u.role)}</span></td>
                    <td style="color:var(--body-grey);font-size:var(--font-sm);">${formatDate(u.created_at)}</td>
                    <td>
                      ${u.role !== 'superadmin' ? `
                        <div style="display:flex;gap:6px;">
                          <button class="btn btn-ghost btn-sm btn-edit" data-id="${u.id}"><i class="fa-solid fa-pen"></i></button>
                          ${user?.role === 'superadmin' ? `<button class="btn btn-danger btn-sm btn-delete" data-id="${u.id}" data-name="${u.name}"><i class="fa-solid fa-trash"></i></button>` : ''}
                        </div>
                      ` : '<span style="color:var(--body-grey-light);font-size:var(--font-sm);">Protected</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    `;

    document.getElementById('btn-add-user')?.addEventListener('click', () => openUserForm());
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = userList.find(x => x.id == btn.dataset.id);
        if (u) openEditForm(u);
      });
    });
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await confirm(`Hapus user "${btn.dataset.name}"?`);
        if (!ok) return;
        try {
          await usersApi.delete(btn.dataset.id);
          showToast('User dihapus', 'success');
          loadData();
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
    document.getElementById('btn-logout')?.addEventListener('click', logout);
  }

  function openUserForm() {
    const { close, overlay } = showModal({
      title: 'Tambah User Baru',
      content: `
        <div class="form-group"><label class="form-label">Nama</label><input type="text" class="form-input" id="user-name" placeholder="Nama lengkap" required /></div>
        <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="user-email" placeholder="email@contoh.com" required /></div>
        <div class="form-group"><label class="form-label">Password</label><input type="password" class="form-input" id="user-password" placeholder="Min 6 karakter" required /></div>
        <div class="form-group"><label class="form-label">Role</label>
          <select class="form-select" id="user-role">
            <option value="kasir">Kasir</option>
            <option value="pembeli">Pembeli</option>
            ${user?.role === 'superadmin' ? '<option value="admin">Admin</option>' : ''}
          </select>
        </div>
      `,
      footer: `<button class="btn btn-ghost" id="modal-cancel">Batal</button><button class="btn btn-primary" id="modal-save">Tambah</button>`,
    });

    overlay.querySelector('#modal-cancel').addEventListener('click', close);
    overlay.querySelector('#modal-save').addEventListener('click', async () => {
      const data = {
        name: overlay.querySelector('#user-name').value,
        email: overlay.querySelector('#user-email').value,
        password: overlay.querySelector('#user-password').value,
        role: overlay.querySelector('#user-role').value,
      };
      if (!data.name || !data.email || !data.password) { showToast('Semua field harus diisi', 'warning'); return; }
      try {
        await usersApi.create(data);
        showToast('User berhasil ditambahkan', 'success');
        close(); loadData();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  function openEditForm(u) {
    const { close, overlay } = showModal({
      title: 'Edit User',
      content: `
        <div class="form-group"><label class="form-label">Nama</label><input type="text" class="form-input" id="user-name" value="${u.name}" /></div>
        <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="user-email" value="${u.email}" /></div>
        <div class="form-group"><label class="form-label">Role</label>
          <select class="form-select" id="user-role">
            <option value="kasir" ${u.role === 'kasir' ? 'selected' : ''}>Kasir</option>
            <option value="pembeli" ${u.role === 'pembeli' ? 'selected' : ''}>Pembeli</option>
            ${user?.role === 'superadmin' ? `<option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>` : ''}
          </select>
        </div>
      `,
      footer: `<button class="btn btn-ghost" id="modal-cancel">Batal</button><button class="btn btn-primary" id="modal-save">Simpan</button>`,
    });

    overlay.querySelector('#modal-cancel').addEventListener('click', close);
    overlay.querySelector('#modal-save').addEventListener('click', async () => {
      const data = {
        name: overlay.querySelector('#user-name').value,
        email: overlay.querySelector('#user-email').value,
        role: overlay.querySelector('#user-role').value,
      };
      try {
        await usersApi.update(u.id, data);
        showToast('User diperbarui', 'success');
        close(); loadData();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  await loadData();
}
