// Muma POS — Stock Management
import { menu as menuApi, categories as catApi } from '../../api.js';
import { getUser, logout } from '../../auth.js';
import { showToast, formatPrice, showModal } from '../../components/utils.js';

export default async function POSStock(container) {
  let menuItems = [];
  let categoryList = [];
  const user = getUser();

  async function loadData() {
    try {
      const [menuData, catData] = await Promise.all([
        menuApi.list(),
        catApi.list(),
      ]);
      menuItems = menuData.menu || [];
      categoryList = catData.categories || [];
      renderStock();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function renderStock() {
    container.innerHTML = `
      <div class="pos-layout">
        <aside class="pos-sidebar">
          <div class="pos-sidebar-header">
            <span class="pos-logo">🍜</span>
            <div>
              <h2 class="pos-brand">Muma POS</h2>
              <p class="pos-user">${user?.name || 'Kasir'}</p>
            </div>
          </div>
          <nav class="pos-nav">
            <a class="pos-nav-item" href="#/pos/dashboard"><i class="fa-solid fa-cash-register"></i> POS Terminal</a>
            <a class="pos-nav-item" href="#/pos/orders"><i class="fa-solid fa-list-check"></i> Antrian Pesanan</a>
            <a class="pos-nav-item active" href="#/pos/stock"><i class="fa-solid fa-boxes-stacked"></i> Kelola Stok</a>
          </nav>
          <div class="pos-sidebar-footer">
            <button class="btn btn-ghost btn-sm" id="btn-logout" style="width:100%;"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
          </div>
        </aside>

        <main class="pos-main" style="padding:var(--space-2xl);">
          <h2 style="font-size:var(--font-2xl);font-weight:700;margin-bottom:var(--space-xl);">Kelola Stok</h2>

          <div class="stock-summary" style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-lg);margin-bottom:var(--space-2xl);">
            <div class="card" style="text-align:center;">
              <div style="font-size:var(--font-2xl);font-weight:700;color:var(--success);">${menuItems.filter(m => m.is_available && m.stock > 10).length}</div>
              <div style="color:var(--body-grey);font-size:var(--font-sm);">Stok Aman</div>
            </div>
            <div class="card" style="text-align:center;">
              <div style="font-size:var(--font-2xl);font-weight:700;color:var(--warning);">${menuItems.filter(m => m.stock > 0 && m.stock <= 10).length}</div>
              <div style="color:var(--body-grey);font-size:var(--font-sm);">Stok Menipis</div>
            </div>
            <div class="card" style="text-align:center;">
              <div style="font-size:var(--font-2xl);font-weight:700;color:var(--danger);">${menuItems.filter(m => m.stock <= 0 || !m.is_available).length}</div>
              <div style="color:var(--body-grey);font-size:var(--font-sm);">Habis / Non-aktif</div>
            </div>
          </div>

          <div class="card" style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Menu Item</th>
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
                    <td><strong>${item.name}</strong></td>
                    <td>${item.category?.name || '-'}</td>
                    <td>${formatPrice(item.price)}</td>
                    <td>
                      <span class="${item.stock <= 0 ? 'price' : item.stock <= 10 ? '' : ''}" style="color:${item.stock <= 0 ? 'var(--danger)' : item.stock <= 10 ? 'var(--warning)' : 'var(--success)'}; font-weight:600;">
                        ${item.stock}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${item.is_available ? 'badge-available' : 'badge-unavailable'}">
                        ${item.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex;gap:6px;">
                        <button class="btn btn-ghost btn-sm btn-edit-stock" data-id="${item.id}" data-name="${item.name}" data-stock="${item.stock}">
                          <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn ${item.is_available ? 'btn-danger' : 'btn-success'} btn-sm btn-toggle" data-id="${item.id}" data-available="${item.is_available}">
                          ${item.is_available ? '<i class="fa-solid fa-toggle-on"></i>' : '<i class="fa-solid fa-toggle-off"></i>'}
                        </button>
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

    // Event: Edit stock
    container.querySelectorAll('.btn-edit-stock').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const currentStock = btn.dataset.stock;

        const { close, overlay } = showModal({
          title: `Update Stok: ${name}`,
          content: `
            <div class="form-group">
              <label class="form-label">Jumlah Stok Baru</label>
              <input type="number" class="form-input" id="new-stock" value="${currentStock}" min="0" />
            </div>
          `,
          footer: `
            <button class="btn btn-ghost" id="modal-cancel">Batal</button>
            <button class="btn btn-primary" id="modal-save">Simpan</button>
          `,
        });

        overlay.querySelector('#modal-cancel').addEventListener('click', close);
        overlay.querySelector('#modal-save').addEventListener('click', async () => {
          const newStock = parseInt(overlay.querySelector('#new-stock').value);
          try {
            await menuApi.updateStock(id, newStock);
            showToast('Stok berhasil diperbarui', 'success');
            close();
            loadData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    });

    // Event: Toggle availability
    container.querySelectorAll('.btn-toggle').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const isAvailable = btn.dataset.available === 'true';
        try {
          await menuApi.toggleAvailability(id, !isAvailable);
          showToast(`Menu ${isAvailable ? 'dinonaktifkan' : 'diaktifkan'}`, 'success');
          loadData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    document.getElementById('btn-logout')?.addEventListener('click', logout);
  }

  await loadData();
}
