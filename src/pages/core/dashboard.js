// Muma Core — Admin Dashboard
import { dashboard as dashboardApi } from '../../api.js';
import { getUser, logout, canAccess, getRoleLabel } from '../../auth.js';
import { showToast, formatPrice, formatDate, getStatusLabel, getOrderTypeLabel } from '../../components/utils.js';
import { navigate } from '../../router.js';

export default async function CoreDashboard(container) {
  const user = getUser();
  container.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;

  let stats = null;

  try {
    const data = await dashboardApi.stats();
    stats = data.stats;
  } catch (err) {
    showToast(err.message, 'error');
  }

  container.innerHTML = `
    <div class="core-layout">
      <aside class="core-sidebar">
        <div class="core-sidebar-header">
          <span class="pos-logo">🍜</span>
          <div>
            <h2 class="pos-brand">Muma Core</h2>
            <p class="pos-user">${user?.name || 'Admin'}</p>
            <span class="badge badge-role-${user?.role}">${getRoleLabel(user?.role)}</span>
          </div>
        </div>
        <nav class="pos-nav">
          <a class="pos-nav-item active" href="#/core/dashboard"><i class="fa-solid fa-chart-line"></i> Dashboard</a>
          <a class="pos-nav-item" href="#/core/orders"><i class="fa-solid fa-receipt"></i> Pesanan</a>
          <a class="pos-nav-item" href="#/core/menu"><i class="fa-solid fa-bowl-food"></i> Menu</a>
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
          <div>
            <h1 style="font-size:var(--font-2xl);font-weight:700;">Dashboard</h1>
            <p style="color:var(--body-grey);">Selamat datang, ${user?.name}! Berikut ringkasan hari ini.</p>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--terracotta);"><i class="fa-solid fa-receipt"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats?.today_orders || 0}</span>
              <span class="stat-label">Pesanan Hari Ini</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--success);"><i class="fa-solid fa-money-bill-wave"></i></div>
            <div class="stat-info">
              <span class="stat-value">${formatPrice(stats?.today_revenue || 0)}</span>
              <span class="stat-label">Pendapatan Hari Ini</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--brand-orange);"><i class="fa-solid fa-fire"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats?.active_orders || 0}</span>
              <span class="stat-label">Pesanan Aktif</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--info);"><i class="fa-solid fa-circle-check"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats?.completed_today || 0}</span>
              <span class="stat-label">Selesai Hari Ini</span>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <!-- Popular Items -->
          <div class="card">
            <h3 style="margin-bottom:var(--space-lg);"><i class="fa-solid fa-trophy" style="color:var(--brand-orange);"></i> Menu Terlaris Hari Ini</h3>
            ${(stats?.popular_items || []).length > 0 ? `
              <div class="popular-list">
                ${(stats?.popular_items || []).map((item, i) => `
                  <div class="popular-item">
                    <span class="popular-rank">${i + 1}</span>
                    <div class="popular-info">
                      <strong>${item.name}</strong>
                      <span style="color:var(--body-grey);font-size:var(--font-sm);">${item.total_qty} porsi</span>
                    </div>
                    <span class="price">${formatPrice(item.total_sales)}</span>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color:var(--body-grey);">Belum ada data</p>'}
          </div>

          <!-- Stock Alert -->
          <div class="card">
            <h3 style="margin-bottom:var(--space-lg);"><i class="fa-solid fa-triangle-exclamation" style="color:var(--warning);"></i> Perhatian Stok</h3>
            <div style="display:flex;gap:var(--space-xl);margin-bottom:var(--space-lg);">
              <div>
                <div style="font-size:var(--font-xl);font-weight:700;color:var(--warning);">${stats?.low_stock || 0}</div>
                <div style="font-size:var(--font-sm);color:var(--body-grey);">Stok Menipis</div>
              </div>
              <div>
                <div style="font-size:var(--font-xl);font-weight:700;color:var(--danger);">${stats?.out_of_stock || 0}</div>
                <div style="font-size:var(--font-sm);color:var(--body-grey);">Habis</div>
              </div>
              <div>
                <div style="font-size:var(--font-xl);font-weight:700;">${stats?.total_menu || 0}</div>
                <div style="font-size:var(--font-sm);color:var(--body-grey);">Total Menu</div>
              </div>
            </div>
            <a href="#/core/stock" class="btn btn-ghost btn-sm"><i class="fa-solid fa-arrow-right"></i> Lihat Detail</a>
          </div>
        </div>

        <!-- Recent Orders -->
        <div class="card" style="margin-top:var(--space-xl);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-lg);">
            <h3><i class="fa-solid fa-clock" style="color:var(--body-grey-light);"></i> Pesanan Terbaru</h3>
            <a href="#/core/orders" class="btn btn-ghost btn-sm">Lihat Semua <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div style="overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No. Pesanan</th>
                  <th>Pelanggan</th>
                  <th>Tipe</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                ${(stats?.recent_orders || []).map(order => `
                  <tr>
                    <td><strong>${order.order_number}</strong></td>
                    <td>${order.user?.name || '-'}</td>
                    <td><span class="badge badge-${order.order_type}">${getOrderTypeLabel(order.order_type)}</span></td>
                    <td><span class="badge badge-${order.status}">${getStatusLabel(order.status)}</span></td>
                    <td class="price">${formatPrice(order.total_amount)}</td>
                    <td style="color:var(--body-grey);">${formatDate(order.created_at)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;

  document.getElementById('btn-logout')?.addEventListener('click', logout);
}
