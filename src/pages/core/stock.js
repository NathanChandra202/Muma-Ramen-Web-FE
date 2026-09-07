// Muma Core — Stock Management (admin version, same as POS stock but in core layout)
import { menu as menuApi } from '../../api.js';
import { getUser, logout, getRoleLabel } from '../../auth.js';
import { showToast, formatPrice, showModal } from '../../components/utils.js';

export default async function CoreStock(container) {
  let menuItems = [];
  const user = getUser();

  async function loadData() {
    try {
      const data = await menuApi.list();
      menuItems = data.menu || [];
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
            <a class="pos-nav-item active" href="#/core/stock"><i class="fa-solid fa-boxes-stacked"></i> Stok</a>
            <a class="pos-nav-item" href="#/core/users"><i class="fa-solid fa-users-gear"></i> Users</a>
          </nav>
          <div class="pos-sidebar-footer"><button class="btn btn-ghost btn-sm" id="btn-logout" style="width:100%;"><i class="fa-solid fa-right-from-bracket"></i> Logout</button></div>
        </aside>

        <main class="core-main">
          <div class="core-header">
            <h1 style="font-size:var(--font-2xl);font-weight:700;">Kelola Stok</h1>
          </div>

          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-lg);margin-bottom:var(--space-xl);">
            <div class="card" style="text-align:center;"><div style="font-size:var(--font-2xl);font-weight:700;">${menuItems.length}</div><div style="color:var(--body-grey);font-size:var(--font-sm);">Total Menu</div></div>
            <div class="card" style="text-align:center;"><div style="font-size:var(--font-2xl);font-weight:700;color:var(--success);">${menuItems.filter(m => m.is_available && m.stock > 10).length}</div><div style="color:var(--body-grey);font-size:var(--font-sm);">Stok Aman</div></div>
            <div class="card" style="text-align:center;"><div style="font-size:var(--font-2xl);font-weight:700;color:var(--warning);">${menuItems.filter(m => m.stock > 0 && m.stock <= 10).length}</div><div style="color:var(--body-grey);font-size:var(--font-sm);">Menipis</div></div>
            <div class="card" style="text-align:center;"><div style="font-size:var(--font-2xl);font-weight:700;color:var(--danger);">${menuItems.filter(m => m.stock <= 0 || !m.is_available).length}</div><div style="color:var(--body-grey);font-size:var(--font-sm);">Habis</div></div>
          </div>

          <div class="card" style="overflow-x:auto;">
            <table class="data-table">
              <thead><tr><th>Menu</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                ${menuItems.map(item => `
                  <tr>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.category?.name || '-'}</td>
                    <td>${formatPrice(item.price)}</td>
                    <td style="font-weight:600;color:${item.stock <= 0 ? 'var(--danger)' : item.stock <= 10 ? 'var(--warning)' : 'var(--success)'};">${item.stock}</td>
                    <td><span class="badge ${item.is_available ? 'badge-available' : 'badge-unavailable'}">${item.is_available ? 'Tersedia' : 'Habis'}</span></td>
                    <td>
                      <div style="display:flex;gap:6px;">
                        <button class="btn btn-ghost btn-sm btn-edit-stock" data-id="${item.id}" data-name="${item.name}" data-stock="${item.stock}"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn ${item.is_available ? 'btn-danger' : 'btn-success'} btn-sm btn-toggle" data-id="${item.id}" data-available="${item.is_available}">${item.is_available ? '<i class="fa-solid fa-toggle-on"></i>' : '<i class="fa-solid fa-toggle-off"></i>'}</button>
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

    container.querySelectorAll('.btn-edit-stock').forEach(btn => {
      btn.addEventListener('click', () => {
        const { close, overlay } = showModal({
          title: `Update Stok: ${btn.dataset.name}`,
          content: `<div class="form-group"><label class="form-label">Stok Baru</label><input type="number" class="form-input" id="new-stock" value="${btn.dataset.stock}" min="0" /></div>`,
          footer: `<button class="btn btn-ghost" id="modal-cancel">Batal</button><button class="btn btn-primary" id="modal-save">Simpan</button>`,
        });
        overlay.querySelector('#modal-cancel').addEventListener('click', close);
        overlay.querySelector('#modal-save').addEventListener('click', async () => {
          try {
            await menuApi.updateStock(btn.dataset.id, parseInt(overlay.querySelector('#new-stock').value));
            showToast('Stok diperbarui', 'success');
            close(); loadData();
          } catch (err) { showToast(err.message, 'error'); }
        });
      });
    });

    container.querySelectorAll('.btn-toggle').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await menuApi.toggleAvailability(btn.dataset.id, btn.dataset.available !== 'true');
          showToast('Status diperbarui', 'success');
          loadData();
        } catch (err) { showToast(err.message, 'error'); }
      });
    });

    document.getElementById('btn-logout')?.addEventListener('click', logout);
  }

  await loadData();
}
