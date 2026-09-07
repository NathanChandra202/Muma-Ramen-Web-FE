// Muma Order — Cart & Checkout page
import { orders as orderApi } from '../../api.js';
import { getCart, getCartTotal, updateQuantity, removeFromCart, clearCart, updateItemNotes } from '../../cart.js';
import { showToast, formatPrice, getMenuImage, showModal } from '../../components/utils.js';
import { navigate } from '../../router.js';

export default function CartPage(container) {
  function render() {
    const cart = getCart();
    const total = getCartTotal();

    container.innerHTML = `
      <div class="order-page">
        <header class="order-header">
          <div class="order-header-inner">
            <div class="order-header-left">
              <button class="btn btn-ghost btn-icon" id="btn-back">
                <i class="fa-solid fa-arrow-left"></i>
              </button>
              <div>
                <h1 class="header-brand">Keranjang</h1>
                <p class="header-sub">${cart.length} item</p>
              </div>
            </div>
            ${cart.length > 0 ? `
              <button class="btn btn-ghost btn-sm" id="btn-clear" style="color:var(--danger);">
                <i class="fa-solid fa-trash"></i> Kosongkan
              </button>
            ` : ''}
          </div>
        </header>

        <div class="cart-content">
          ${cart.length > 0 ? `
            <div class="cart-items">
              ${cart.map(item => `
                <div class="cart-item" data-id="${item.menu_item_id}">
                  <div class="cart-item-img" style="background-image:url('${getMenuImage(item.image_url, item.name)}')"></div>
                  <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="price">${formatPrice(item.price)}</p>
                    <input type="text" class="cart-item-notes form-input" placeholder="Catatan (opsional)" value="${item.notes || ''}" data-id="${item.menu_item_id}" />
                  </div>
                  <div class="cart-item-actions">
                    <div class="qty-control">
                      <button class="qty-btn" data-action="minus" data-id="${item.menu_item_id}">
                        <i class="fa-solid fa-minus"></i>
                      </button>
                      <span class="qty-value">${item.quantity}</span>
                      <button class="qty-btn" data-action="plus" data-id="${item.menu_item_id}">
                        <i class="fa-solid fa-plus"></i>
                      </button>
                    </div>
                    <span class="cart-item-subtotal">${formatPrice(item.price * item.quantity)}</span>
                    <button class="btn-remove" data-id="${item.menu_item_id}">
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="cart-checkout">
              <div class="checkout-card">
                <h3>Ringkasan Pesanan</h3>
                <div class="checkout-row">
                  <span>Subtotal (${cart.reduce((s, i) => s + i.quantity, 0)} item)</span>
                  <span>${formatPrice(total)}</span>
                </div>
                <div class="checkout-row checkout-total">
                  <span>Total</span>
                  <span class="price">${formatPrice(total)}</span>
                </div>

                <div class="form-group" style="margin-top:var(--space-xl);">
                  <label class="form-label">Tipe Pesanan</label>
                  <select class="form-select" id="order-type">
                    <option value="dine_in">🍽️ Dine In</option>
                    <option value="takeaway">🥡 Take Away</option>
                  </select>
                </div>

                <div class="form-group" id="table-group">
                  <label class="form-label">Nomor Meja</label>
                  <input type="text" class="form-input" id="table-number" placeholder="Contoh: A3" />
                </div>

                <div class="form-group">
                  <label class="form-label">Catatan Pesanan</label>
                  <textarea class="form-input" id="order-notes" placeholder="Ada catatan khusus?"></textarea>
                </div>

                <button class="btn btn-primary btn-lg" id="btn-checkout" style="width:100%;">
                  <i class="fa-solid fa-paper-plane"></i> Pesan Sekarang — ${formatPrice(total)}
                </button>
              </div>
            </div>
          ` : `
            <div class="empty-state" style="padding-top:120px;">
              <i class="fa-solid fa-cart-shopping"></i>
              <h3>Keranjang masih kosong</h3>
              <p>Yuk pilih menu ramen favoritmu!</p>
              <button class="btn btn-primary" id="btn-browse" style="margin-top:1rem;">
                <i class="fa-solid fa-bowl-food"></i> Lihat Menu
              </button>
            </div>
          `}
        </div>
      </div>
    `;

    // Events
    document.getElementById('btn-back')?.addEventListener('click', () => navigate('/order/menu'));
    document.getElementById('btn-browse')?.addEventListener('click', () => navigate('/order/menu'));
    document.getElementById('btn-clear')?.addEventListener('click', () => {
      clearCart();
      render();
      showToast('Keranjang dikosongkan', 'info');
    });

    // Order type toggle table number
    document.getElementById('order-type')?.addEventListener('change', (e) => {
      const tableGroup = document.getElementById('table-group');
      tableGroup.style.display = e.target.value === 'dine_in' ? 'block' : 'none';
    });

    // Quantity controls
    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const action = btn.dataset.action;
        const item = getCart().find(i => i.menu_item_id === id);
        if (item) {
          updateQuantity(id, action === 'plus' ? item.quantity + 1 : item.quantity - 1);
          render();
        }
      });
    });

    // Remove buttons
    container.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFromCart(parseInt(btn.dataset.id));
        render();
        showToast('Item dihapus dari keranjang', 'info');
      });
    });

    // Notes
    container.querySelectorAll('.cart-item-notes').forEach(input => {
      input.addEventListener('change', (e) => {
        updateItemNotes(parseInt(e.target.dataset.id), e.target.value);
      });
    });

    // Checkout
    document.getElementById('btn-checkout')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-checkout');
      const cart = getCart();
      if (cart.length === 0) return;

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

      try {
        const orderData = {
          order_type: document.getElementById('order-type').value,
          table_number: document.getElementById('table-number')?.value || '',
          notes: document.getElementById('order-notes')?.value || '',
          items: cart.map(item => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            notes: item.notes || '',
          })),
        };

        const data = await orderApi.create(orderData);
        clearCart();
        showToast(`Pesanan ${data.order.order_number} berhasil dibuat! 🎉`, 'success');
        navigate('/order/tracking/' + data.order.id);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Pesan Sekarang — ${formatPrice(getCartTotal())}`;
      }
    });
  }

  render();
}
