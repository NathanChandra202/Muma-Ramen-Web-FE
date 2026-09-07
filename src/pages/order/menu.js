// Muma Order — Menu browsing page for Pembeli
import { menu as menuApi, categories as catApi } from '../../api.js';
import { addToCart, getCartCount, onCartChange } from '../../cart.js';
import { getUser, isLoggedIn } from '../../auth.js';
import { showToast, formatPrice, getMenuImage } from '../../components/utils.js';
import { navigate } from '../../router.js';

export default async function MenuPage(container) {
  container.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;

  let menuItems = [];
  let categoryList = [];
  let activeCategory = 'all';
  let searchQuery = '';

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

  function getFilteredItems() {
    return menuItems.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category_id == activeCategory;
      const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }

  function render() {
    const filtered = getFilteredItems();
    const cartCount = getCartCount();

    container.innerHTML = `
      <div class="order-page">
        <!-- Header -->
        <header class="order-header">
          <div class="order-header-inner">
            <div class="order-header-left">
              <span class="header-logo">🍜</span>
              <div>
                <h1 class="header-brand">Muma Ramen</h1>
                <p class="header-sub">Japanese Ramen House</p>
              </div>
            </div>
            <div class="order-header-right">
              ${user ? `<span class="header-user"><i class="fa-solid fa-user"></i> ${user.name}</span>` : ''}
              <button class="btn btn-ghost btn-sm" id="btn-history" title="Riwayat Pesanan">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </button>
              <button class="btn btn-primary cart-btn" id="btn-cart">
                <i class="fa-solid fa-cart-shopping"></i>
                <span>Keranjang</span>
                ${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
              </button>
            </div>
          </div>
        </header>

        <!-- Hero -->
        <section class="order-hero">
          <div class="order-hero-inner">
            <h2>Selamat Datang! 👋</h2>
            <p>Pilih ramen favoritmu dan pesan langsung dari sini</p>
            <div class="search-bar">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="search-input" placeholder="Cari menu..." value="${searchQuery}" />
            </div>
          </div>
        </section>

        <!-- Categories -->
        <nav class="category-nav">
          <div class="category-nav-inner">
            <button class="cat-pill ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">
              <i class="fa-solid fa-bowl-food"></i> Semua
            </button>
            ${categoryList.map(cat => `
              <button class="cat-pill ${activeCategory == cat.id ? 'active' : ''}" data-cat="${cat.id}">
                ${cat.name}
              </button>
            `).join('')}
          </div>
        </nav>

        <!-- Menu Grid -->
        <section class="menu-section">
          <div class="menu-grid">
            ${filtered.length > 0 ? filtered.map(item => `
              <div class="menu-card" data-id="${item.id}">
                <div class="menu-card-img" style="background-image:url('${getMenuImage(item.image_url, item.name)}')">
                  ${item.stock <= 5 ? `<span class="stock-warn">Sisa ${item.stock}</span>` : ''}
                </div>
                <div class="menu-card-body">
                  <span class="menu-card-cat">${item.category?.name || ''}</span>
                  <h3 class="menu-card-name">${item.name}</h3>
                  <p class="menu-card-desc">${item.description}</p>
                  <div class="menu-card-footer">
                    <span class="menu-card-price">${formatPrice(item.price)}</span>
                    <button class="btn btn-primary btn-sm btn-add-cart" data-id="${item.id}">
                      <i class="fa-solid fa-plus"></i> Tambah
                    </button>
                  </div>
                </div>
              </div>
            `).join('') : `
              <div class="empty-state" style="grid-column:1/-1;">
                <i class="fa-solid fa-bowl-food"></i>
                <h3>Menu tidak ditemukan</h3>
                <p>Coba cari dengan kata kunci lain</p>
              </div>
            `}
          </div>
        </section>
      </div>
    `;

    // Event listeners
    document.getElementById('search-input')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });

    container.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        render();
      });
    });

    container.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isLoggedIn()) {
          showToast('Silakan login dulu untuk memesan', 'warning');
          navigate('/login');
          return;
        }
        const id = parseInt(btn.dataset.id);
        const item = menuItems.find(m => m.id === id);
        if (item) {
          addToCart(item);
          showToast(`${item.name} ditambahkan ke keranjang`, 'success');
          // Update cart badge
          const cartBadge = container.querySelector('.cart-badge');
          const newCount = getCartCount();
          if (cartBadge) {
            cartBadge.textContent = newCount;
          } else {
            const cartBtn = document.getElementById('btn-cart');
            if (cartBtn) {
              const badge = document.createElement('span');
              badge.className = 'cart-badge';
              badge.textContent = newCount;
              cartBtn.appendChild(badge);
            }
          }
          // Mini animation on button
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Ditambah!';
          btn.classList.add('btn-success');
          setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-plus"></i> Tambah';
            btn.classList.remove('btn-success');
          }, 800);
        }
      });
    });

    document.getElementById('btn-cart')?.addEventListener('click', () => {
      if (!isLoggedIn()) {
        showToast('Silakan login dulu', 'warning');
        navigate('/login');
        return;
      }
      navigate('/order/cart');
    });

    document.getElementById('btn-history')?.addEventListener('click', () => {
      if (!isLoggedIn()) {
        showToast('Silakan login dulu', 'warning');
        navigate('/login');
        return;
      }
      navigate('/order/history');
    });
  }

  render();

  const unsub = onCartChange(() => {
    // Update cart badge in header
    const badge = container.querySelector('.cart-badge');
    const count = getCartCount();
    if (badge) {
      badge.textContent = count;
      if (count === 0) badge.remove();
    }
  });

  return () => unsub();
}
