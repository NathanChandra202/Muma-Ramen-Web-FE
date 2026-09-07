// Muma Core — Menu Management
import { menu as menuApi, categories as catApi } from '../../api.js';
import { getUser, logout, getRoleLabel } from '../../auth.js';
import { showToast, formatPrice, showModal, confirm, getMenuImage } from '../../components/utils.js';

export default async function CoreMenu(container) {
  let menuItems = [];
  let categoryList = [];
  const user = getUser();

  async function loadData() {
    try {
      const [menuData, catData] = await Promise.all([menuApi.list(), catApi.list()]);
      menuItems = menuData.menu || [];
      categoryList = catData.categories || [];
      renderPage();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function renderPage() {
    container.innerHTML = `
      <div class="core-layout">
        <aside class="core-sidebar">
          <div class="core-sidebar-header">
            <span class="pos-logo">🍜</span>
            <div>
              <h2 class="pos-brand">Muma Core</h2>
              <p class="pos-user">${user?.name}</p>
              <span class="badge badge-role-${user?.role}">${getRoleLabel(user?.role)}</span>
            </div>
          </div>
          <nav class="pos-nav">
            <a class="pos-nav-item" href="#/core/dashboard"><i class="fa-solid fa-chart-line"></i> Dashboard</a>
            <a class="pos-nav-item" href="#/core/orders"><i class="fa-solid fa-receipt"></i> Pesanan</a>
            <a class="pos-nav-item active" href="#/core/menu"><i class="fa-solid fa-bowl-food"></i> Menu</a>
            <a class="pos-nav-item" href="#/core/categories"><i class="fa-solid fa-tags"></i> Kategori</a>
            <a class="pos-nav-item" href="#/core/stock"><i class="fa-solid fa-boxes-stacked"></i> Stok</a>
            <a class="pos-nav-item" href="#/core/users"><i class="fa-solid fa-users-gear"></i> Users</a>
          </nav>
          <div class="pos-sidebar-footer">
            <button class="btn btn-ghost btn-sm" id="btn-logout" style="width:100%;"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
          </div>
        </aside>

        <main class="core-main">
          <div class="core-header">
            <h1 style="font-size:var(--font-2xl);font-weight:700;">Kelola Menu</h1>
            <button class="btn btn-primary" id="btn-add-menu">
              <i class="fa-solid fa-plus"></i> Tambah Menu
            </button>
          </div>

          <div class="card" style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Menu</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${menuItems.map(item => `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:40px;height:40px;border-radius:8px;background-image:url('${getMenuImage(item.image_url, item.name)}');background-size:cover;background-position:center;flex-shrink:0;"></div>
                        <div>
                          <strong>${item.name}</strong>
                          <div style="font-size:var(--font-xs);color:var(--body-grey-light);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>${item.category?.name || '-'}</td>
                    <td class="price">${formatPrice(item.price)}</td>
                    <td style="font-weight:600;color:${item.stock <= 0 ? 'var(--danger)' : item.stock <= 10 ? 'var(--warning)' : 'var(--success)'};">${item.stock}</td>
                    <td><span class="badge ${item.is_available ? 'badge-available' : 'badge-unavailable'}">${item.is_available ? 'Aktif' : 'Non-aktif'}</span></td>
                    <td>
                      <div style="display:flex;gap:6px;">
                        <button class="btn btn-ghost btn-sm btn-edit" data-id="${item.id}"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-sm btn-delete" data-id="${item.id}" data-name="${item.name}"><i class="fa-solid fa-trash"></i></button>
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

    // Event: Add menu
    document.getElementById('btn-add-menu')?.addEventListener('click', () => openMenuForm());

    // Event: Edit menu
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = menuItems.find(m => m.id == btn.dataset.id);
        if (item) openMenuForm(item);
      });
    });

    // Event: Delete menu
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await confirm(`Hapus menu "${btn.dataset.name}"?`);
        if (!ok) return;
        try {
          await menuApi.delete(btn.dataset.id);
          showToast('Menu dihapus', 'success');
          loadData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    document.getElementById('btn-logout')?.addEventListener('click', logout);
  }

  function openMenuForm(item = null) {
    const isEdit = !!item;
    const { close, overlay } = showModal({
      title: isEdit ? 'Edit Menu' : 'Tambah Menu Baru',
      wide: true,
      content: `
        <div class="form-group">
          <label class="form-label">Nama Menu</label>
          <input type="text" class="form-input" id="menu-name" value="${item?.name || ''}" placeholder="Nama menu" required />
        </div>
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select class="form-select" id="menu-category">
            ${categoryList.map(cat => `<option value="${cat.id}" ${item?.category_id == cat.id ? 'selected' : ''}>${cat.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi</label>
          <textarea class="form-input" id="menu-desc" placeholder="Deskripsi menu">${item?.description || ''}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg);">
          <div class="form-group">
            <label class="form-label">Harga (Rp)</label>
            <input type="number" class="form-input" id="menu-price" value="${item?.price || ''}" placeholder="50000" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Stok</label>
            <input type="number" class="form-input" id="menu-stock" value="${item?.stock ?? 100}" placeholder="100" min="0" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">URL Gambar (opsional)</label>
          <input type="text" class="form-input" id="menu-image" value="${item?.image_url || ''}" placeholder="/images/menu.jpg" />
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" id="modal-cancel">Batal</button>
        <button class="btn btn-primary" id="modal-save">${isEdit ? 'Simpan' : 'Tambah'}</button>
      `,
    });

    overlay.querySelector('#modal-cancel').addEventListener('click', close);
    overlay.querySelector('#modal-save').addEventListener('click', async () => {
      const data = {
        name: overlay.querySelector('#menu-name').value,
        category_id: parseInt(overlay.querySelector('#menu-category').value),
        description: overlay.querySelector('#menu-desc').value,
        price: parseFloat(overlay.querySelector('#menu-price').value),
        stock: parseInt(overlay.querySelector('#menu-stock').value),
        image_url: overlay.querySelector('#menu-image').value,
        is_available: true,
      };

      if (!data.name || !data.price) {
        showToast('Nama dan harga harus diisi', 'warning');
        return;
      }

      try {
        if (isEdit) {
          await menuApi.update(item.id, data);
          showToast('Menu berhasil diperbarui', 'success');
        } else {
          await menuApi.create(data);
          showToast('Menu berhasil ditambahkan', 'success');
        }
        close();
        loadData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  await loadData();
}
