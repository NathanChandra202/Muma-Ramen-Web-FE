// Muma POS — Kasir Dashboard (Quick POS terminal)
import { menu as menuApi, categories as catApi, orders as orderApi } from '../../api.js';
import { getUser, logout } from '../../auth.js';
import { showToast, formatPrice, getMenuImage, showModal } from '../../components/utils.js';
import { navigate } from '../../router.js';

export default async function POSDashboard(container) {
  let menuItems = [];
  let categoryList = [];
  let activeCategory = 'all';
  let currentOrder = [];
  let orderType = 'dine_in';
  let tableNumber = '';
  let orderNotes = '';

  try {
    const [menuData, catData] = await Promise.all([
      menuApi.list({ available: 'true' }),
      catApi.list(),
    ]);
    menuItems = menuData.menu || [];
    categoryList = catData.categories || [];
  } catch (err) {
    showToast(err.message, 'error');
  }

  const user = getUser();

  function getOrderTotal() {
    return currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function render() {
    const filteredItems = activeCategory === 'all'
      ? menuItems
      : menuItems.filter(m => m.category_id == activeCategory);
    const total = getOrderTotal();

    container.innerHTML = `
      <div class="pos-layout">
        <!-- Sidebar Navigation -->
        <aside class="pos-sidebar">
          <div class="pos-sidebar-header">
            <span class="pos-logo">🍜</span>
            <div>
              <h2 class="pos-brand">Muma POS</h2>
              <p class="pos-user">${user?.name || 'Kasir'}</p>
            </div>
          </div>

          <nav class="pos-nav">
            <a class="pos-nav-item active" href="#/pos/dashboard">
              <i class="fa-solid fa-cash-register"></i> POS Terminal
            </a>
            <a class="pos-nav-item" href="#/pos/orders">
              <i class="fa-solid fa-list-check"></i> Antrian Pesanan
            </a>
            <a class="pos-nav-item" href="#/pos/stock">
              <i class="fa-solid fa-boxes-stacked"></i> Kelola Stok
            </a>
          </nav>

          <div class="pos-sidebar-footer">
            <button class="btn btn-ghost btn-sm" id="btn-logout" style="width:100%;">
              <i class="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </aside>

        <!-- Main Content: Menu Grid -->
        <main class="pos-main">
          <div class="pos-toolbar">
            <div class="pos-categories">
              <button class="cat-pill ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">Semua</button>
              ${categoryList.map(cat => `
                <button class="cat-pill ${activeCategory == cat.id ? 'active' : ''}" data-cat="${cat.id}">${cat.name}</button>
              `).join('')}
            </div>
          </div>

          <div class="pos-menu-grid">
            ${filteredItems.map(item => `
              <button class="pos-menu-item ${!item.is_available ? 'unavailable' : ''}" data-id="${item.id}" ${!item.is_available ? 'disabled' : ''}>
                <div class="pos-item-img" style="background-image:url('${getMenuImage(item.image_url, item.name)}')"></div>
                <div class="pos-item-info">
                  <span class="pos-item-name">${item.name}</span>
                  <span class="pos-item-price">${formatPrice(item.price)}</span>
                  ${item.stock <= 10 ? `<span class="pos-item-stock">Stok: ${item.stock}</span>` : ''}
                </div>
              </button>
            `).join('')}
          </div>
        </main>

        <!-- Right Panel: Current Order -->
        <aside class="pos-order-panel">
          <div class="pos-order-header">
            <h3>Pesanan Baru</h3>
            <div class="pos-order-type">
              <button class="order-type-btn ${orderType === 'dine_in' ? 'active' : ''}" data-type="dine_in">
                <i class="fa-solid fa-utensils"></i> Dine In
              </button>
              <button class="order-type-btn ${orderType === 'takeaway' ? 'active' : ''}" data-type="takeaway">
                <i class="fa-solid fa-bag-shopping"></i> Take Away
              </button>
            </div>
            ${orderType === 'dine_in' ? `
              <input type="text" class="form-input" id="pos-table" placeholder="No. Meja" value="${tableNumber}" style="margin-top:8px;" />
            ` : ''}
          </div>

          <div class="pos-order-items">
            ${currentOrder.length > 0 ? currentOrder.map((item, index) => `
              <div class="pos-order-item">
                <div class="pos-order-item-info">
                  <span class="pos-order-item-name">${item.name}</span>
                  <span class="pos-order-item-price">${formatPrice(item.price)}</span>
                </div>
                <div class="pos-order-item-controls">
                  <button class="qty-btn-sm" data-action="minus" data-index="${index}">−</button>
                  <span>${item.quantity}</span>
                  <button class="qty-btn-sm" data-action="plus" data-index="${index}">+</button>
                  <button class="btn-remove-sm" data-index="${index}">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            `).join('') : `
              <div class="pos-order-empty">
                <i class="fa-solid fa-cart-shopping" style="font-size:2rem;opacity:0.2;"></i>
                <p>Tap menu untuk menambah item</p>
              </div>
            `}
          </div>

          <div class="pos-order-footer">
            <div class="pos-order-total">
              <span>TOTAL</span>
              <span class="price" style="font-size:var(--font-2xl);">${formatPrice(total)}</span>
            </div>
            <div class="pos-order-actions">
              ${currentOrder.length > 0 ? `
                <button class="btn btn-ghost" id="btn-clear-order">
                  <i class="fa-solid fa-xmark"></i> Batal
                </button>
              ` : ''}
              <button class="btn btn-primary btn-lg" id="btn-submit-order" ${currentOrder.length === 0 ? 'disabled' : ''} style="flex:1;">
                <i class="fa-solid fa-check"></i> Proses Pesanan
              </button>
            </div>
          </div>
        </aside>
      </div>
    `;

    // Event: Category filter
    container.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        render();
      });
    });

    // Event: Add item to order
    container.querySelectorAll('.pos-menu-item:not(.unavailable)').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const item = menuItems.find(m => m.id === id);
        if (!item) return;

        const existing = currentOrder.find(o => o.menu_item_id === id);
        if (existing) {
          existing.quantity += 1;
        } else {
          currentOrder.push({
            menu_item_id: id,
            name: item.name,
            price: item.price,
            quantity: 1,
          });
        }
        render();
      });
    });

    // Event: Quantity controls
    container.querySelectorAll('.qty-btn-sm').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const action = btn.dataset.action;
        if (action === 'plus') {
          currentOrder[index].quantity += 1;
        } else {
          currentOrder[index].quantity -= 1;
          if (currentOrder[index].quantity <= 0) {
            currentOrder.splice(index, 1);
          }
        }
        render();
      });
    });

    // Event: Remove item
    container.querySelectorAll('.btn-remove-sm').forEach(btn => {
      btn.addEventListener('click', () => {
        currentOrder.splice(parseInt(btn.dataset.index), 1);
        render();
      });
    });

    // Event: Order type
    container.querySelectorAll('.order-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        orderType = btn.dataset.type;
        render();
      });
    });

    // Event: Table number
    document.getElementById('pos-table')?.addEventListener('input', (e) => {
      tableNumber = e.target.value;
    });

    // Event: Clear
    document.getElementById('btn-clear-order')?.addEventListener('click', () => {
      currentOrder = [];
      tableNumber = '';
      orderNotes = '';
      render();
    });

    // Event: Submit order
    document.getElementById('btn-submit-order')?.addEventListener('click', async () => {
      if (currentOrder.length === 0) return;
      const btn = document.getElementById('btn-submit-order');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

      try {
        const data = await orderApi.create({
          order_type: orderType,
          table_number: tableNumber,
          notes: orderNotes,
          items: currentOrder.map(item => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            notes: '',
          })),
        });

        showToast(`✅ Pesanan ${data.order.order_number} berhasil dibuat!`, 'success');
        currentOrder = [];
        tableNumber = '';
        orderNotes = '';

        // Refresh menu (stock might have changed)
        const menuData = await menuApi.list({ available: 'true' });
        menuItems = menuData.menu || [];

        render();
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Proses Pesanan';
      }
    });

    // Event: Logout
    document.getElementById('btn-logout')?.addEventListener('click', logout);
  }

  render();
}
