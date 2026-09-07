// Muma Order — Order tracking page
import { orders as orderApi } from '../../api.js';
import { showToast, formatPrice, formatDate, getStatusLabel, getOrderTypeLabel } from '../../components/utils.js';
import { navigate, getCurrentPath } from '../../router.js';

export default async function TrackingPage(container) {
  const path = getCurrentPath();
  const orderId = path.split('/').pop();

  let order = null;
  let pollInterval = null;

  async function loadOrder() {
    try {
      const data = await orderApi.get(orderId);
      order = data.order;
      renderOrder();
    } catch (err) {
      showToast(err.message, 'error');
      container.innerHTML = `
        <div class="order-page">
          <div class="empty-state" style="padding-top:120px;">
            <i class="fa-solid fa-circle-xmark"></i>
            <h3>Pesanan tidak ditemukan</h3>
            <button class="btn btn-primary" onclick="window.location.hash='#/order/menu'">Kembali ke Menu</button>
          </div>
        </div>
      `;
    }
  }

  function renderOrder() {
    if (!order) return;

    const steps = ['pending', 'preparing', 'ready', 'completed'];
    const currentStep = steps.indexOf(order.status);
    const isCancelled = order.status === 'cancelled';

    container.innerHTML = `
      <div class="order-page">
        <header class="order-header">
          <div class="order-header-inner">
            <div class="order-header-left">
              <button class="btn btn-ghost btn-icon" id="btn-back">
                <i class="fa-solid fa-arrow-left"></i>
              </button>
              <div>
                <h1 class="header-brand">Tracking Pesanan</h1>
                <p class="header-sub">${order.order_number}</p>
              </div>
            </div>
            <span class="badge badge-${order.status}">${getStatusLabel(order.status)}</span>
          </div>
        </header>

        <div class="tracking-content">
          <!-- Progress Steps -->
          ${!isCancelled ? `
            <div class="tracking-progress">
              ${steps.map((step, i) => `
                <div class="tracking-step ${i <= currentStep ? 'active' : ''} ${i === currentStep ? 'current' : ''}">
                  <div class="step-icon">
                    ${i < currentStep ? '<i class="fa-solid fa-check"></i>' :
                      i === 0 ? '<i class="fa-solid fa-clock"></i>' :
                      i === 1 ? '<i class="fa-solid fa-fire-burner"></i>' :
                      i === 2 ? '<i class="fa-solid fa-bell"></i>' :
                      '<i class="fa-solid fa-circle-check"></i>'}
                  </div>
                  <span class="step-label">${getStatusLabel(step)}</span>
                </div>
                ${i < steps.length - 1 ? '<div class="step-line ' + (i < currentStep ? 'active' : '') + '"></div>' : ''}
              `).join('')}
            </div>
          ` : `
            <div class="tracking-cancelled">
              <i class="fa-solid fa-ban"></i>
              <h3>Pesanan Dibatalkan</h3>
            </div>
          `}

          <!-- Order Info -->
          <div class="tracking-info card">
            <div class="tracking-info-row">
              <span><i class="fa-solid fa-hashtag"></i> No. Pesanan</span>
              <strong>${order.order_number}</strong>
            </div>
            <div class="tracking-info-row">
              <span><i class="fa-solid fa-utensils"></i> Tipe</span>
              <span class="badge badge-${order.order_type}">${getOrderTypeLabel(order.order_type)}</span>
            </div>
            ${order.table_number ? `
              <div class="tracking-info-row">
                <span><i class="fa-solid fa-chair"></i> Meja</span>
                <strong>${order.table_number}</strong>
              </div>
            ` : ''}
            <div class="tracking-info-row">
              <span><i class="fa-solid fa-clock"></i> Waktu Pesan</span>
              <span>${formatDate(order.created_at)}</span>
            </div>
          </div>

          <!-- Order Items -->
          <div class="tracking-items card">
            <h3 style="margin-bottom:var(--space-lg);">Detail Pesanan</h3>
            ${(order.items || []).map(item => `
              <div class="tracking-item">
                <div class="tracking-item-info">
                  <span class="tracking-item-qty">${item.quantity}x</span>
                  <span>${item.menu_item?.name || 'Item'}</span>
                  ${item.notes ? `<span class="tracking-item-notes">"${item.notes}"</span>` : ''}
                </div>
                <span class="price">${formatPrice(item.subtotal)}</span>
              </div>
            `).join('')}
            <div class="tracking-total">
              <span>Total</span>
              <span class="price" style="font-size:var(--font-xl);">${formatPrice(order.total_amount)}</span>
            </div>
          </div>

          ${order.notes ? `
            <div class="card">
              <h4 style="margin-bottom:var(--space-sm);"><i class="fa-solid fa-note-sticky"></i> Catatan</h4>
              <p style="color:var(--body-grey);">${order.notes}</p>
            </div>
          ` : ''}

          <div style="text-align:center;margin-top:var(--space-xl);">
            <button class="btn btn-ghost" id="btn-menu">
              <i class="fa-solid fa-bowl-food"></i> Pesan Lagi
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-back')?.addEventListener('click', () => navigate('/order/history'));
    document.getElementById('btn-menu')?.addEventListener('click', () => navigate('/order/menu'));
  }

  await loadOrder();

  // Poll for updates if order is active
  if (order && !['completed', 'cancelled'].includes(order.status)) {
    pollInterval = setInterval(async () => {
      try {
        const data = await orderApi.get(orderId);
        if (data.order.status !== order.status) {
          order = data.order;
          renderOrder();
          if (order.status === 'ready') {
            showToast('🔔 Pesananmu sudah siap! Silakan diambil.', 'success', 5000);
          } else if (order.status === 'completed') {
            showToast('✅ Pesanan selesai. Terima kasih!', 'success');
            clearInterval(pollInterval);
          }
        }
      } catch {
        // silently ignore
      }
    }, 5000);
  }

  return () => {
    if (pollInterval) clearInterval(pollInterval);
  };
}
