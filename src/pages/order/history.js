// Muma Order — Order history page
import { orders as orderApi } from '../../api.js';
import { showToast, formatPrice, formatDate, getStatusLabel, getOrderTypeLabel } from '../../components/utils.js';
import { navigate } from '../../router.js';

export default async function HistoryPage(container) {
  container.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;

  let orderList = [];
  try {
    const data = await orderApi.list();
    orderList = data.orders || [];
  } catch (err) {
    showToast(err.message, 'error');
  }

  container.innerHTML = `
    <div class="order-page">
      <header class="order-header">
        <div class="order-header-inner">
          <div class="order-header-left">
            <button class="btn btn-ghost btn-icon" id="btn-back">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <h1 class="header-brand">Riwayat Pesanan</h1>
              <p class="header-sub">${orderList.length} pesanan</p>
            </div>
          </div>
        </div>
      </header>

      <div class="history-content">
        ${orderList.length > 0 ? orderList.map(order => `
          <div class="history-card card card-hover" data-id="${order.id}">
            <div class="history-card-header">
              <div>
                <span class="history-order-num">${order.order_number}</span>
                <span class="badge badge-${order.order_type}" style="margin-left:8px;">${getOrderTypeLabel(order.order_type)}</span>
              </div>
              <span class="badge badge-${order.status}">${getStatusLabel(order.status)}</span>
            </div>
            <div class="history-card-items">
              ${(order.items || []).map(item => `
                <span class="history-item-tag">${item.quantity}x ${item.menu_item?.name || 'Item'}</span>
              `).join('')}
            </div>
            <div class="history-card-footer">
              <span class="history-date">${formatDate(order.created_at)}</span>
              <span class="price">${formatPrice(order.total_amount)}</span>
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <h3>Belum ada pesanan</h3>
            <p>Pesan ramen favoritmu sekarang!</p>
            <button class="btn btn-primary" id="btn-order" style="margin-top:1rem;">
              <i class="fa-solid fa-bowl-food"></i> Lihat Menu
            </button>
          </div>
        `}
      </div>
    </div>
  `;

  document.getElementById('btn-back')?.addEventListener('click', () => navigate('/order/menu'));
  document.getElementById('btn-order')?.addEventListener('click', () => navigate('/order/menu'));

  container.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', () => {
      navigate('/order/tracking/' + card.dataset.id);
    });
  });
}
