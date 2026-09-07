// Muma Core — Category Management
import { categories as catApi } from '../../api.js';
import { getUser, logout, getRoleLabel } from '../../auth.js';
import { showToast, showModal, confirm } from '../../components/utils.js';

export default async function CoreCategories(container) {
  let categoryList = [];
  const user = getUser();

  async function loadData() {
    try {
      const data = await catApi.list(true);
      categoryList = data.categories || [];
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
            <a class="pos-nav-item active" href="#/core/categories"><i class="fa-solid fa-tags"></i> Kategori</a>
            <a class="pos-nav-item" href="#/core/stock"><i class="fa-solid fa-boxes-stacked"></i> Stok</a>
            <a class="pos-nav-item" href="#/core/users"><i class="fa-solid fa-users-gear"></i> Users</a>
          </nav>
          <div class="pos-sidebar-footer"><button class="btn btn-ghost btn-sm" id="btn-logout" style="width:100%;"><i class="fa-solid fa-right-from-bracket"></i> Logout</button></div>
        </aside>

        <main class="core-main">
          <div class="core-header">
            <h1 style="font-size:var(--font-2xl);font-weight:700;">Kelola Kategori</h1>
            <button class="btn btn-primary" id="btn-add-cat"><i class="fa-solid fa-plus"></i> Tambah Kategori</button>
          </div>

          <div class="card" style="overflow-x:auto;">
            <table class="data-table">
              <thead><tr><th>Nama</th><th>Deskripsi</th><th>Urutan</th><th>Jumlah Menu</th><th>Aksi</th></tr></thead>
              <tbody>
                ${categoryList.map(cat => `
                  <tr>
                    <td><strong>${cat.name}</strong></td>
                    <td style="color:var(--body-grey);">${cat.description || '-'}</td>
                    <td>${cat.sort_order}</td>
                    <td>${(cat.menu_items || []).length} item</td>
                    <td>
                      <div style="display:flex;gap:6px;">
                        <button class="btn btn-ghost btn-sm btn-edit" data-id="${cat.id}"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-sm btn-delete" data-id="${cat.id}" data-name="${cat.name}"><i class="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    `;

    document.getElementById('btn-add-cat')?.addEventListener('click', () => openCatForm());
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = categoryList.find(c => c.id == btn.dataset.id);
        if (cat) openCatForm(cat);
      });
    });
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await confirm(`Hapus kategori "${btn.dataset.name}"?`);
        if (!ok) return;
        try {
          await catApi.delete(btn.dataset.id);
          showToast('Kategori dihapus', 'success');
          loadData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
    document.getElementById('btn-logout')?.addEventListener('click', logout);
  }

  function openCatForm(cat = null) {
    const isEdit = !!cat;
    const { close, overlay } = showModal({
      title: isEdit ? 'Edit Kategori' : 'Tambah Kategori',
      content: `
        <div class="form-group"><label class="form-label">Nama</label><input type="text" class="form-input" id="cat-name" value="${cat?.name || ''}" placeholder="Nama kategori" /></div>
        <div class="form-group"><label class="form-label">Deskripsi</label><input type="text" class="form-input" id="cat-desc" value="${cat?.description || ''}" placeholder="Deskripsi singkat" /></div>
        <div class="form-group"><label class="form-label">Urutan</label><input type="number" class="form-input" id="cat-order" value="${cat?.sort_order ?? 0}" min="0" /></div>
      `,
      footer: `<button class="btn btn-ghost" id="modal-cancel">Batal</button><button class="btn btn-primary" id="modal-save">${isEdit ? 'Simpan' : 'Tambah'}</button>`,
    });

    overlay.querySelector('#modal-cancel').addEventListener('click', close);
    overlay.querySelector('#modal-save').addEventListener('click', async () => {
      const data = {
        name: overlay.querySelector('#cat-name').value,
        description: overlay.querySelector('#cat-desc').value,
        sort_order: parseInt(overlay.querySelector('#cat-order').value) || 0,
      };
      if (!data.name) { showToast('Nama harus diisi', 'warning'); return; }
      try {
        if (isEdit) { await catApi.update(cat.id, data); showToast('Kategori diperbarui', 'success'); }
        else { await catApi.create(data); showToast('Kategori ditambahkan', 'success'); }
        close(); loadData();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  await loadData();
}
