// Muma Core — Order Overview
import { orders as orderApi } from '../../api.js';
import { getUser, logout, getRoleLabel } from '../../auth.js';
import { showToast, formatPrice, formatDate, getStatusLabel, getOrderTypeLabel, confirm } from '../../components/utils.js';

export default async function CoreOrders(container) {
  let orderList = [];
  let statusFilter = '';
  const user = getUser();

  async function loadData() {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await orderApi.list(params);
      orderList = data.orders || [];
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
            <a class="pos-nav-item active" href="#/core/orders"><i class="fa-solid fa-receipt"></i> Pesanan</a>
            <a class="pos-nav-item" href="#/core/menu"><i class="fa-solid fa-bowl-food"></i> Menu</a>
            <a class="pos-nav-item" href="#/core/categories"><i class="fa-solid fa-tags"></i> Kategori</a>
            <a class="pos-nav-item" href="#/core/stock"><i class="fa-solid fa-boxes-stacked"></i> Stok</a>
            <a class="pos-nav-item" href="#/core/users"><i class="fa-solid fa-users-gear"></i> Users</a>
          </nav>
          <div class="pos-sidebar-footer"><button class="btn btn-ghost btn-sm" id="btn-logout" style="width:100%;"><i class="fa-solid fa-right-from-bracket"></i> Logout</button></div>
        </aside>

        <main class="core-main">
          <div class="core-header">
            <h1 style="font-size:var(--font-2xl);font-weight:700;">Semua Pesanan</h1>
            <div style="display:flex;gap:8px;">
              <button class="btn ${!statusFilter ? 'btn-primary' : 'btn-ghost'} btn-sm" data-filter="">Semua</button>
              <button class="btn ${statusFilter === 'pending' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-filter="pending">Pending</button>
              <button class="btn ${statusFilter === 'preparing' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-filter="preparing">Proses</button>
              <button class="btn ${statusFilter === 'ready' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-filter="ready">Siap</button>
              <button class="btn ${statusFilter === 'completed' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-filter="completed">Selesai</button>
              <button class="btn ${statusFilter === 'cancelled' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-filter="cancelled">Batal</button>
            </div>
          </div>

          <div class="card" style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No. Pesanan</th>
                  <th>Pelanggan</th>
                  <th>Tipe</th>
                  <th>Meja</th>
                  <th>Item</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Waktu</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${orderList.map(order => `
                  <tr>
                    <td><strong>${order.order_number}</strong></td>
                    <td>${order.user?.name || '-'}</td>
                    <td><span class="badge badge-${order.order_type}">${getOrderTypeLabel(order.order_type)}</span></td>
                    <td>${order.table_number || '-'}</td>
                    <td style="font-size:var(--font-sm);max-width:200px;">
                      ${(order.items || []).map(i => `${i.quantity}x ${i.menu_item?.name || ''}`).join(', ')}
                    </td>
                    <td class="price">${formatPrice(order.total_amount)}</td>
                    <td><span class="badge badge-${order.status}">${getStatusLabel(order.status)}</span></td>
                    <td style="font-size:var(--font-sm);color:var(--body-grey);">${formatDate(order.created_at)}</td>
                    <td>
                      ${!['completed', 'cancelled'].includes(order.status) ? `
                        <button class="btn btn-danger btn-sm btn-cancel" data-id="${order.id}"><i class="fa-solid fa-xmark"></i></button>
                      ` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${orderList.length === 0 ? '<div class="empty-state"><i class="fa-solid fa-inbox"></i><h3>Tidak ada pesanan</h3></div>' : ''}
          </div>
        </main>
      </div>
    `;

    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => { statusFilter = btn.dataset.filter; loadData(); });
    });

    container.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await confirm('Batalkan pesanan ini?');
        if (!ok) return;
        try {
          await orderApi.cancel(btn.dataset.id);
          showToast('Pesanan dibatalkan', 'info');
          loadData();
        } catch (err) { showToast(err.message, 'error'); }
      });
    });

    document.getElementById('btn-logout')?.addEventListener('click', logout);
  }

  await loadData();
}
