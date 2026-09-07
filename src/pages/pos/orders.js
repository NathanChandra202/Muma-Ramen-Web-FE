// Muma POS — Order Queue Management
import { orders as orderApi } from '../../api.js';
import { getUser, logout } from '../../auth.js';
import { showToast, formatPrice, formatDate, formatShortDate, getStatusLabel, getOrderTypeLabel, confirm } from '../../components/utils.js';

export default async function POSOrders(container) {
  let orderList = [];
  let statusFilter = '';
  let pollInterval = null;
  const user = getUser();

  async function loadOrders() {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await orderApi.list(params);
      orderList = data.orders || [];
      renderOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function renderOrders() {
    const activeOrders = orderList.filter(o => !['completed', 'cancelled'].includes(o.status));
    const finishedOrders = orderList.filter(o => ['completed', 'cancelled'].includes(o.status));

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
            <a class="pos-nav-item active" href="#/pos/orders"><i class="fa-solid fa-list-check"></i> Antrian Pesanan</a>
            <a class="pos-nav-item" href="#/pos/stock"><i class="fa-solid fa-boxes-stacked"></i> Kelola Stok</a>
          </nav>
          <div class="pos-sidebar-footer">
            <button class="btn btn-ghost btn-sm" id="btn-logout" style="width:100%;"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
          </div>
        </aside>

        <main class="pos-main" style="padding:var(--space-2xl);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl);">
            <h2 style="font-size:var(--font-2xl);font-weight:700;">Antrian Pesanan</h2>
            <div style="display:flex;gap:8px;">
              <button class="btn ${!statusFilter ? 'btn-primary' : 'btn-ghost'} btn-sm" data-filter="">Semua</button>
              <button class="btn ${statusFilter === 'pending' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-filter="pending">Menunggu</button>
              <button class="btn ${statusFilter === 'preparing' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-filter="preparing">Diproses</button>
              <button class="btn ${statusFilter === 'ready' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-filter="ready">Siap</button>
            </div>
          </div>

          ${activeOrders.length > 0 ? `
            <div class="order-queue-grid">
              ${activeOrders.map(order => `
                <div class="order-queue-card card" data-id="${order.id}">
                  <div class="oq-header">
                    <div>
                      <span class="oq-number">${order.order_number}</span>
                      <span class="badge badge-${order.order_type}">${getOrderTypeLabel(order.order_type)}</span>
                    </div>
                    <span class="badge badge-${order.status}">${getStatusLabel(order.status)}</span>
                  </div>
                  ${order.table_number ? `<div class="oq-table"><i class="fa-solid fa-chair"></i> Meja ${order.table_number}</div>` : ''}
                  <div class="oq-items">
                    ${(order.items || []).map(item => `
                      <div class="oq-item">
                        <span>${item.quantity}x ${item.menu_item?.name || 'Item'}</span>
                        ${item.notes ? `<span class="oq-item-note">${item.notes}</span>` : ''}
                      </div>
                    `).join('')}
                  </div>
                  ${order.notes ? `<div class="oq-notes"><i class="fa-solid fa-note-sticky"></i> ${order.notes}</div>` : ''}
                  <div class="oq-footer">
                    <span class="oq-time">${formatShortDate(order.created_at)}</span>
                    <span class="price">${formatPrice(order.total_amount)}</span>
                  </div>
                  <div class="oq-actions">
                    ${order.status === 'pending' ? `
                      <button class="btn btn-success btn-sm btn-status" data-id="${order.id}" data-status="preparing">
                        <i class="fa-solid fa-fire-burner"></i> Proses
                      </button>
                      <button class="btn btn-danger btn-sm btn-cancel" data-id="${order.id}">
                        <i class="fa-solid fa-xmark"></i> Tolak
                      </button>
                    ` : order.status === 'preparing' ? `
                      <button class="btn btn-orange btn-sm btn-status" data-id="${order.id}" data-status="ready">
                        <i class="fa-solid fa-bell"></i> Siap Diambil
                      </button>
                    ` : order.status === 'ready' ? `
                      <button class="btn btn-primary btn-sm btn-status" data-id="${order.id}" data-status="completed">
                        <i class="fa-solid fa-circle-check"></i> Selesai
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <i class="fa-solid fa-inbox"></i>
              <h3>Tidak ada pesanan aktif</h3>
              <p>Pesanan baru akan muncul di sini</p>
            </div>
          `}

          ${finishedOrders.length > 0 && !statusFilter ? `
            <h3 style="margin-top:var(--space-3xl);margin-bottom:var(--space-lg);color:var(--body-grey);">Riwayat Hari Ini</h3>
            <div class="order-queue-grid">
              ${finishedOrders.slice(0, 10).map(order => `
                <div class="order-queue-card card" style="opacity:0.7;">
                  <div class="oq-header">
                    <span class="oq-number">${order.order_number}</span>
                    <span class="badge badge-${order.status}">${getStatusLabel(order.status)}</span>
                  </div>
                  <div class="oq-footer">
                    <span class="oq-time">${formatShortDate(order.created_at)}</span>
                    <span class="price">${formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </main>
      </div>
    `;

    // Event: Filters
    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        statusFilter = btn.dataset.filter;
        loadOrders();
      });
    });

    // Event: Status updates
    container.querySelectorAll('.btn-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await orderApi.updateStatus(btn.dataset.id, btn.dataset.status);
          showToast('Status pesanan diperbarui', 'success');
          loadOrders();
        } catch (err) {
          showToast(err.message, 'error');
          btn.disabled = false;
        }
      });
    });

    // Event: Cancel
    container.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await confirm('Batalkan pesanan ini?');
        if (!ok) return;
        try {
          await orderApi.updateStatus(btn.dataset.id, 'cancelled');
          showToast('Pesanan dibatalkan', 'info');
          loadOrders();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    document.getElementById('btn-logout')?.addEventListener('click', logout);
  }

  await loadOrders();

  // Auto-refresh every 10 seconds
  pollInterval = setInterval(loadOrders, 10000);

  return () => {
    if (pollInterval) clearInterval(pollInterval);
  };
}
